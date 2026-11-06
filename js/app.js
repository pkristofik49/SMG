/* Vue is the only external dependency. Navigation uses native hash history. */
(function () {
  'use strict';
  const { createApp, ref, computed, onMounted, onUnmounted, nextTick, watch } = Vue;
  const rules = Game2048;
  const SAVE_KEY = 'little-arcade.2048.v1';
  const BEST_KEY = 'little-arcade.2048.best';
  const LANGUAGE_KEY = 'little-arcade.language';
  const GAMES = [
    { id: 'classic', hash: '#/2048', saveKey: SAVE_KEY, bestKey: BEST_KEY },
    { id: 'speedy', hash: '#/2048-speedy', saveKey: 'little-arcade.2048-speedy.v1', bestKey: 'little-arcade.2048-speedy.best' }
  ];
  const routeGame = () => GAMES.find(game => game.hash === location.hash);
  const translations = ArcadeTranslations;
  function readStored(key, legacyKey) {
    const current = localStorage.getItem(key);
    if (current !== null) return current;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      try { localStorage.setItem(key, legacy); } catch { /* Keep reading the original if storage is full. */ }
    }
    return legacy;
  }
  createApp({
    setup() {
      const page = ref(routeGame() ? 'game' : 'menu');
      const games = GAMES;
      const activeGame = ref(routeGame()?.id || 'classic');
      const currentGame = computed(() => games.find(game => game.id === activeGame.value));
      const isSpeedy = computed(() => activeGame.value === 'speedy');
      const speedyClock = createSpeedyClock();
      const remainingMs = ref(2000), timeBudgetMs = ref(2000);
      const timerStarted = ref(false);
      let clockInterval;
      const gameStates = ref({});
      const languages = translations.languages;
      const language = ref('cs');
      try {
        const savedLanguage = readStored(LANGUAGE_KEY, translations.legacyStorageKeys.language);
        if (languages.some(option => option.code === savedLanguage)) language.value = savedLanguage;
      } catch { /* Language switching also works without browser storage. */ }
      const locale = computed(() => languages.find(option => option.code === language.value).locale);
      const numberFormatter = computed(() => new Intl.NumberFormat(locale.value));
      const tileFormatter = computed(() => new Intl.NumberFormat(locale.value, { useGrouping: false }));
      const pluralRules = computed(() => new Intl.PluralRules(locale.value));
      const secondsFormatter = computed(() => new Intl.NumberFormat(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      const timeLabel = computed(() => t('speedy.remaining', { time: secondsFormatter.value.format(remainingMs.value / 1000) }));
      const timeFraction = computed(() => Math.min(1, remainingMs.value / timeBudgetMs.value));
      function t(key, parameters = {}) {
        const text = translations[language.value][key] ?? translations.cs[key] ?? key;
        return text.replace(/\{(\w+)\}/g, (placeholder, name) => parameters[name] ?? placeholder);
      }
      const format = number => numberFormatter.value.format(number);
      const shortcutTitle = (key, shortcut) => `${t(key)} (${shortcut})`;
      const formatTile = number => tileFormatter.value.format(number);
      function plural(key, count) {
        const selectedKey = `${key}.${pluralRules.value.select(count)}`;
        return t(Object.hasOwn(translations[language.value], selectedKey) ? selectedKey : `${key}.other`, { count: format(count) });
      }
      function setLanguage(code) {
        if (!languages.some(option => option.code === code)) return;
        language.value = code;
        announcement.value = '';
        try { localStorage.setItem(LANGUAGE_KEY, code); } catch { /* Keep the in-memory choice. */ }
      }
      watch([language, page, activeGame], () => {
        document.documentElement.lang = language.value;
        document.documentElement.dir = languages.find(option => option.code === language.value).direction || 'ltr';
        document.title = page.value === 'game' ? t('meta.gameTitle', {
          game: `${formatTile(2048)} ${t(`game.variant.${activeGame.value}`)}`
        }) : t('meta.menuTitle');
        document.querySelector('meta[name="description"]').content = t('meta.description');
      }, { immediate: true });
      const board = ref(Array(16).fill(0));
      const guideVisible = ref(true);
      const expanded = ref(false), expandedBoardSize = ref(500), playPage = ref(null);
      let previousGuideVisible = true, expandedObserver;
      function sizeExpandedBoard() {
        if (!expanded.value || !playPage.value) return;
        const main = playPage.value;
        const area = main.querySelector('.game-area');
        const topbar = main.querySelector('.play-topbar');
        if (!area || !topbar) return;
        const style = getComputedStyle(main);
        const number = value => parseFloat(value) || 0;
        const otherHeight = Array.from(area.children).filter(child => !child.classList.contains('board-wrap')).reduce((total, child) => {
          const childStyle = getComputedStyle(child);
          return childStyle.display === 'none' ? total : total + child.getBoundingClientRect().height + number(childStyle.marginTop) + number(childStyle.marginBottom);
        }, 0);
        const width = main.clientWidth - number(style.paddingLeft) - number(style.paddingRight);
        const height = main.clientHeight - number(style.paddingTop) - number(style.paddingBottom) - topbar.getBoundingClientRect().height - number(style.rowGap) - otherHeight;
        expandedBoardSize.value = Math.max(1, Math.floor(Math.min(width, height)));
      }
      async function toggleExpanded() {
        expanded.value = !expanded.value;
        if (expanded.value) { previousGuideVisible = guideVisible.value; guideVisible.value = false; }
        else guideVisible.value = previousGuideVisible;
        await nextTick(); sizeExpandedBoard(); focusBoard();
      }
      watch([expanded, isSpeedy, language], async () => {
        document.getElementById('app').classList.toggle('expanded-mode', expanded.value);
        await nextTick();
        expandedObserver?.disconnect();
        if (!expanded.value || !playPage.value || !expandedObserver) return;
        const main = playPage.value;
        expandedObserver.observe(main);
        main.querySelectorAll('.play-topbar, .game-area > :not(.board-wrap)').forEach(element => expandedObserver.observe(element));
        sizeExpandedBoard();
      }, { flush: 'post' });
      const sound = createArcadeAudio();
      const soundEnabled = ref(false);
      const audioAvailable = Boolean(window.AudioContext || window.webkitAudioContext);
      let soundToggleId = 0;
      async function toggleSound() {
        const id = ++soundToggleId;
        soundEnabled.value = !soundEnabled.value;
        const enabled = await sound.setEnabled(soundEnabled.value);
        if (id === soundToggleId) soundEnabled.value = enabled;
      }
      function onVisibilityChange() { if (document.hidden) sound.stop(); }
      const score = ref(0), best = ref(0), moves = ref(0);
      const won = ref(false), continued = ref(false), previous = ref(null);
      const spawned = ref(-1), overlay = ref(null), announcement = ref('');
      const animating = ref(false), motionTiles = ref([]), merged = ref([]), motionLayer = ref(null);
      const MOVE_DURATION = 160;
      let activeAnimations = [], animationTimer = null, animationId = 0, queuedDirection = null, resizeObserver;
      let animationBoardSize = null;
      const hasSavedGame = ref(false), storageAvailable = ref(true);
      const boardElement = ref(null), dialogPrimary = ref(null), pointerStart = ref(null);
      const overlayTitle = computed(() => overlay.value ? t(`dialog.${overlay.value}.title`) : '');
      function snapshot() {
        return { board: board.value.slice(), score: score.value, moves: moves.value, won: won.value, continued: continued.value,
          ...(isSpeedy.value ? { remainingMs: speedyClock.remaining(), timeBudgetMs: timeBudgetMs.value, timerStarted: timerStarted.value } : {}) };
      }
      function syncSpeedyTime() {
        if (!isSpeedy.value) return;
        remainingMs.value = speedyClock.remaining();
        if (remainingMs.value <= 0 && page.value === 'game' && overlay.value !== 'timeout') {
          speedyClock.pause(); stopAnimation(); overlay.value = 'timeout';
          announcement.value = t('dialog.timeout.title'); persist();
        }
      }
      function pauseSpeedyTime() {
        if (!isSpeedy.value || !speedyClock.isRunning()) return;
        remainingMs.value = speedyClock.pause();
        persist();
      }
      function resumeSpeedyTime() {
        if (isSpeedy.value && timerStarted.value && page.value === 'game' && !overlay.value) {
          speedyClock.start(); syncSpeedyTime();
        }
      }
      function validState(state) {
        return state && rules.validBoard(state.board) && state.board.filter(Boolean).length >= 2 &&
          Number.isSafeInteger(state.score) && state.score >= 0 && Number.isSafeInteger(state.moves) && state.moves >= 0 &&
          typeof state.won === 'boolean' && typeof state.continued === 'boolean' &&
          state.won === state.board.some(value => value >= 2048) && (!state.continued || state.won);
      }
      function persist() {
        gameStates.value[activeGame.value] = { ...snapshot(), previous: previous.value, best: best.value };
        try {
          localStorage.setItem(currentGame.value.saveKey, JSON.stringify({ ...snapshot(), previous: previous.value }));
          localStorage.setItem(currentGame.value.bestKey, String(best.value));
          hasSavedGame.value = moves.value > 0;
        } catch { storageAvailable.value = false; }
      }
      function restore(state) {
        board.value = state.board.slice(); score.value = state.score; moves.value = state.moves;
        won.value = state.won; continued.value = state.continued;
        if (isSpeedy.value) {
          timerStarted.value = typeof state.timerStarted === 'boolean' ? state.timerStarted : state.moves > 0;
          const storedTime = Number.isFinite(state.remainingMs) && state.remainingMs >= 0 ? state.remainingMs : 2000;
          speedyClock.reset(storedTime); remainingMs.value = storedTime;
          timeBudgetMs.value = Number.isFinite(state.timeBudgetMs) && state.timeBudgetMs >= storedTime && state.timeBudgetMs > 0 ? state.timeBudgetMs : Math.max(2000, storedTime);
        }
      }
      function activateGame(id) {
        activeGame.value = id;
        const state = gameStates.value[id];
        best.value = state.best;
        previous.value = state.previous;
        spawned.value = -1;
        if (validState(state)) restore(state); else newGame();
      }
      function checkEnd() {
        overlay.value = isSpeedy.value && speedyClock.remaining() <= 0 ? 'timeout' : won.value && !continued.value ? 'won' : !rules.canMove(board.value) ? 'over' : null;
      }
      async function focusBoard() { await nextTick(); boardElement.value?.focus({ preventScroll: true }); }
      function stopAnimation() {
        sound.stop();
        animationId++;
        clearTimeout(animationTimer);
        activeAnimations.forEach(animation => animation.cancel());
        activeAnimations = [];
        animating.value = false;
        animationBoardSize = null;
        motionTiles.value = [];
        merged.value = [];
        spawned.value = -1;
        queuedDirection = null;
      }
      function finishAnimation(id, result, newIndex) {
        if (id !== animationId) return;
        const pending = queuedDirection;
        stopAnimation();
        spawned.value = newIndex;
        merged.value = result.merges;
        if (result.merges.length) sound.merge();
        checkEnd();
        // Commit the landing effect before starting another queued movement.
        if (pending && !overlay.value) nextTick(() => move(pending));
      }
      async function animateMove(result, newIndex) {
        const cells = boardElement.value?.children;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!cells || reducedMotion || !Element.prototype.animate) {
          if (result.merges.length) sound.merge();
          spawned.value = newIndex; merged.value = result.merges; checkEnd(); return;
        }
        const bounds = boardElement.value.getBoundingClientRect();
        animationBoardSize = { width: bounds.width, height: bounds.height };
        const positions = Array.from(cells, cell => cell.getBoundingClientRect());
        const id = ++animationId;
        motionTiles.value = result.movements.map(tile => {
          const from = positions[tile.from], to = positions[tile.to];
          return { ...tile, dx: to.left - from.left, dy: to.top - from.top, style: {
            left: `${from.left - bounds.left}px`, top: `${from.top - bounds.top}px`,
            width: `${from.width}px`, height: `${from.height}px`
          } };
        });
        animating.value = true;
        await nextTick();
        if (id !== animationId) return;
        activeAnimations = Array.from(motionLayer.value.children, (element, index) => {
          const tile = motionTiles.value[index];
          return element.animate([
            { transform: 'translate(0, 0)' },
            { transform: `translate(${tile.dx}px, ${tile.dy}px)` }
          ], { duration: MOVE_DURATION, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
        });
        // A timer also completes the move if the browser suspends animation frames.
        animationTimer = setTimeout(() => finishAnimation(id, result, newIndex), MOVE_DURATION);
      }
      function newGame() {
        stopAnimation();
        speedyClock.reset(); remainingMs.value = 2000; timeBudgetMs.value = 2000;
        timerStarted.value = false;
        board.value = rules.spawn(rules.spawn(Array(16).fill(0)).board).board;
        score.value = 0; moves.value = 0; won.value = false; continued.value = false;
        previous.value = null; overlay.value = null; spawned.value = -1;
        announcement.value = t('announcement.new');
        persist(); focusBoard();
        resumeSpeedyTime();
      }
      function requestNew() {
        syncSpeedyTime();
        stopAnimation();
        if (moves.value) overlay.value = 'restart'; else newGame();
      }
      function move(direction) {
        syncSpeedyTime();
        if (overlay.value || page.value !== 'game') return;
        if (animating.value) { queuedDirection = direction; return; }
        const result = rules.move(board.value, direction);
        if (!result.changed) { sound.blocked(); checkEnd(); return; }
        const beforeMove = snapshot();
        if (isSpeedy.value) {
          if (!speedyClock.reward()) { syncSpeedyTime(); return; }
          timerStarted.value = true;
          speedyClock.start();
          remainingMs.value = speedyClock.remaining();
          timeBudgetMs.value = Math.max(1000, remainingMs.value);
        }
        previous.value = beforeMove;
        sound.move();
        merged.value = []; spawned.value = -1;
        const next = rules.spawn(result.board);
        board.value = next.board;
        score.value += result.points; moves.value++;
        best.value = Math.max(best.value, score.value);
        won.value = board.value.some(value => value >= 2048);
        persist();
        animateMove(result, next.index);
        announcement.value = t('announcement.move', { count: format(moves.value), score: format(score.value) }) +
          (result.points ? ` ${plural('announcement.points', result.points)}` : '');
      }
      function undo() {
        syncSpeedyTime();
        if (overlay.value === 'timeout') return;
        if (!previous.value) return;
        const timeAfterUndo = isSpeedy.value ? Math.max(0, speedyClock.remaining() - 1000) : null;
        const wasTimerStarted = timerStarted.value;
        stopAnimation();
        restore(previous.value); previous.value = null; spawned.value = -1;
        if (isSpeedy.value) {
          timerStarted.value = wasTimerStarted;
          speedyClock.reset(timeAfterUndo); remainingMs.value = timeAfterUndo;
          timeBudgetMs.value = Math.max(1000, timeAfterUndo);
        }
        checkEnd(); persist(); announcement.value = t('announcement.undo'); focusBoard();
        resumeSpeedyTime();
      }
      function continueGame() { continued.value = true; checkEnd(); persist(); if (!overlay.value) focusBoard(); }
      function dismissOverlay() { if (overlay.value === 'restart') { overlay.value = null; focusBoard(); } }
      function trapDialogFocus(event) {
        const controls = Array.from(event.currentTarget.querySelectorAll('button, a[href]'));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
      function onKey(event) {
        if (page.value !== 'game' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing || event.defaultPrevented) return;
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return;
        const key = event.key.toLowerCase();
        if (key === 'h') {
          event.preventDefault();
          if (!event.repeat) guideVisible.value = !guideVisible.value;
          return;
        }
        if (key === 'f') {
          event.preventDefault();
          if (!event.repeat) toggleExpanded();
          return;
        }
        if (key === 'escape' && expanded.value && !overlay.value) {
          event.preventDefault(); toggleExpanded(); return;
        }
        if (key === 'z') {
          event.preventDefault();
          if (!event.repeat && audioAvailable) toggleSound();
          return;
        }
        if (key === 'n') {
          event.preventDefault();
          if (!event.repeat) {
            if (overlay.value === 'restart') newGame(); else requestNew();
          }
          return;
        }
        if (overlay.value === 'restart' && (key === 'enter' || key === 'backspace')) {
          event.preventDefault();
          if (!event.repeat) {
            if (key === 'enter') newGame(); else dismissOverlay();
          }
          return;
        }
        if (target?.closest('button, a')) return;
        const direction = directions[event.key] || directions[key];
        if (direction && !overlay.value) { event.preventDefault(); move(direction); }
      }
      function onBoardKey(event) { onKey(event); }
      function onPointerDown(event) {
        if (overlay.value || !event.isPrimary || event.button !== 0) return;
        pointerStart.value = { x: event.clientX, y: event.clientY, id: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus({ preventScroll: true });
      }
      function onPointerUp(event) {
        const start = pointerStart.value;
        pointerStart.value = null;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
      }
      async function navigate() {
        pauseSpeedyTime();
        stopAnimation();
        const selectedGame = routeGame();
        page.value = selectedGame ? 'game' : 'menu';
        if (!selectedGame && expanded.value) {
          expanded.value = false; guideVisible.value = previousGuideVisible;
        }
        if (selectedGame && selectedGame.id !== activeGame.value) activateGame(selectedGame.id);
        pointerStart.value = null;
        if (page.value === 'game') checkEnd(); else overlay.value = null;
        await nextTick();
        window.scrollTo(0, 0);
        if (page.value === 'game') { if (overlay.value) dialogPrimary.value?.focus(); else focusBoard(); }
        else document.getElementById('menu-title')?.focus({ preventScroll: true });
        resumeSpeedyTime();
      }
      watch(overlay, value => { if (value) pauseSpeedyTime(); else resumeSpeedyTime(); }, { flush: 'sync' });
      watch(overlay, async value => { if (value) { await nextTick(); dialogPrimary.value?.focus({ preventScroll: true }); } });
      onMounted(() => {
        for (const game of games) {
          let saved = null, record = 0;
          try {
            const storedBest = Number(game.id === 'classic' ? readStored(game.bestKey, translations.legacyStorageKeys.best) : localStorage.getItem(game.bestKey));
            if (Number.isSafeInteger(storedBest) && storedBest >= 0) record = storedBest;
            saved = JSON.parse(game.id === 'classic' ? readStored(game.saveKey, translations.legacyStorageKeys.save) : localStorage.getItem(game.saveKey));
          } catch { storageAvailable.value = false; }
          gameStates.value[game.id] = validState(saved)
            ? { ...saved, best: Math.max(record, saved.score), previous: validState(saved.previous) ? saved.previous : null }
            : { best: record, previous: null, score: 0, moves: 0 };
        }
        activateGame(activeGame.value);
        expandedObserver = new ResizeObserver(sizeExpandedBoard);
        window.addEventListener('resize', sizeExpandedBoard);
        window.visualViewport?.addEventListener('resize', sizeExpandedBoard);
        window.addEventListener('hashchange', navigate);
        window.addEventListener('keydown', onKey);
        document.addEventListener('visibilitychange', onVisibilityChange);
        navigate();
        clockInterval = setInterval(syncSpeedyTime, 25);
        window.addEventListener('pagehide', pauseSpeedyTime);
        window.addEventListener('pageshow', resumeSpeedyTime);
        // Fixed pixel trajectories are discarded if the responsive layout changes.
        resizeObserver = new ResizeObserver(() => {
          const bounds = boardElement.value?.getBoundingClientRect();
          if (animating.value && animationBoardSize && (!bounds ||
            Math.abs(bounds.width - animationBoardSize.width) > 0.5 ||
            Math.abs(bounds.height - animationBoardSize.height) > 0.5)) {
            stopAnimation(); checkEnd();
          }
        });
        watch(boardElement, element => {
          resizeObserver.disconnect();
          if (element) resizeObserver.observe(element);
        }, { flush: 'post', immediate: true });
      });
      onUnmounted(() => {
        pauseSpeedyTime(); clearInterval(clockInterval);
        window.removeEventListener('pagehide', pauseSpeedyTime);
        window.removeEventListener('pageshow', resumeSpeedyTime);
        stopAnimation(); resizeObserver?.disconnect();
        sound.dispose();
        expandedObserver?.disconnect();
        window.removeEventListener('resize', sizeExpandedBoard);
        window.visualViewport?.removeEventListener('resize', sizeExpandedBoard);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('hashchange', navigate); window.removeEventListener('keydown', onKey);
      });
      function tileClass(value) { return value ? `tile-${Math.min(value, 2048)}` : 'tile-empty'; }
      return { shortcutTitle, expanded, expandedBoardSize, playPage, toggleExpanded, isSpeedy, remainingMs, timeBudgetMs, timeLabel, timeFraction, games, activeGame, gameStates, formatTile, guideVisible, soundEnabled, audioAvailable, toggleSound, language, languages, setLanguage, t, plural, page, board, score, best, moves, previous, spawned, animating, motionTiles, merged, motionLayer, overlay, overlayTitle, announcement, hasSavedGame,
        storageAvailable, boardElement, dialogPrimary, pointerStart, format, tileClass, move, undo, newGame,
        requestNew, continueGame, dismissOverlay, trapDialogFocus, onBoardKey, onPointerDown, onPointerUp };
    }
  }).mount('#app');
})();
