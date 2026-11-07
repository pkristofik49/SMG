/* Sudoku has independent state; the parent owns language, palette and audio. */
(function (root) {
  'use strict';
  const { ref, computed, onMounted, onUnmounted, nextTick, watch } = Vue;
  const KEY = 'little-arcade.sudoku.v1', COMPLETED_KEY = 'little-arcade.sudoku.completed';
  root.SudokuGame = {
    props: ['t', 'formatTile', 'language'], emits: ['change', 'effect'],
    setup(props, { emit }) {
      const difficulty = ref('medium'), puzzle = ref([]), values = ref([]), notes = ref([]);
      const selected = ref(0), noteMode = ref(false), help = ref(true), confirmNew = ref(false), completed = ref(0), storageAvailable = ref(true), board = ref(null), primary = ref(null), nextDifficulty = ref('medium');
      const history = ref([]);
      const errors = computed(() => SudokuRules.conflicts(values.value));
      const solved = computed(() => values.value.length === 81 && values.value.every(Boolean) && errors.value.size === 0);
      const filled = computed(() => values.value.filter(Boolean).length);
      const editable = computed(() => !puzzle.value[selected.value]);
      function persist() {
        const state = { puzzle: puzzle.value, values: values.value, notes: notes.value, difficulty: difficulty.value };
        try { localStorage.setItem(KEY, JSON.stringify(state)); localStorage.setItem(COMPLETED_KEY, String(completed.value)); storageAvailable.value = true; } catch { storageAvailable.value = false; }
        emit('change', { score: filled.value, best: completed.value, moves: solved.value ? 0 : values.value.filter((value, index) => value && !puzzle.value[index]).length });
      }
      function fresh() {
        const generated = SudokuRules.generate(nextDifficulty.value);
        difficulty.value = nextDifficulty.value; puzzle.value = generated.puzzle; values.value = generated.puzzle.slice(); notes.value = Array(81).fill(0);
        selected.value = puzzle.value.findIndex(value => !value); history.value = []; confirmNew.value = false; noteMode.value = false; persist();
        nextTick(() => focusCell(selected.value));
      }
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(KEY)); const record = Number(localStorage.getItem(COMPLETED_KEY));
        completed.value = Number.isSafeInteger(record) && record >= 0 ? record : 0;
      } catch { storageAvailable.value = false; }
      if (SudokuRules.validState(saved)) {
        puzzle.value = saved.puzzle.slice(); values.value = saved.values.slice(); notes.value = saved.notes.slice(); difficulty.value = saved.difficulty; nextDifficulty.value = saved.difficulty;
        selected.value = puzzle.value.findIndex(value => !value);
      } else fresh();
      function focusCell(index) { selected.value = index; board.value?.querySelectorAll('.sudoku-cell')[index]?.focus({ preventScroll: true }); }
      function enter(value) {
        if (!editable.value || solved.value || confirmNew.value) return;
        if (noteMode.value && value && values.value[selected.value]) return;
        if (!noteMode.value && values.value[selected.value] === value && !notes.value[selected.value]) return;
        history.value.push({ values: values.value.slice(), notes: notes.value.slice() }); if (history.value.length > 100) history.value.shift();
        if (noteMode.value && value) notes.value[selected.value] ^= 1 << (value - 1);
        else { values.value[selected.value] = value; notes.value[selected.value] = 0; }
        if (solved.value) { completed.value++; emit('effect', 'merge'); }
        else emit('effect', errors.value.has(selected.value) ? 'blocked' : 'move');
        persist();
      }
      function undo() {
        if (!history.value.length || solved.value) return;
        const state = history.value.pop(); values.value = state.values; notes.value = state.notes; persist();
      }
      function requestNew() { nextDifficulty.value = difficulty.value; confirmNew.value = true; }
      function cancelNew() { confirmNew.value = false; nextDifficulty.value = difficulty.value; nextTick(() => focusCell(selected.value)); }
      function key(event) {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
        if (confirmNew.value && event.key === 'Escape') { event.preventDefault(); cancelNew(); return; }
        if (event.target.closest('input, select, textarea, [contenteditable=true]')) return;
        const key = event.key.toLowerCase();
        if (key === 'n') { event.preventDefault(); if (!event.repeat) confirmNew.value ? fresh() : requestNew(); return; }
        if (confirmNew.value) {
          if (['enter', 'escape', 'backspace'].includes(key)) { event.preventDefault(); if (!event.repeat) key === 'enter' ? fresh() : cancelNew(); }
          return;
        }
        if (key === 'h') { event.preventDefault(); if (!event.repeat) help.value = !help.value; return; }
        if (!event.target.closest('.sudoku-page')) return;
        const directions = { arrowleft: -1, arrowright: 1, arrowup: -9, arrowdown: 9 };
        if (key in directions) { event.preventDefault(); focusCell((selected.value + directions[key] + 81) % 81); }
        else if (/^[1-9]$/.test(key)) { event.preventDefault(); enter(Number(key)); }
        else if (['backspace', 'delete', '0'].includes(key)) { event.preventDefault(); enter(0); }
        else if (key === 'p') { event.preventDefault(); if (!event.repeat) noteMode.value = !noteMode.value; }
      }
      watch(confirmNew, async visible => { if (visible) { await nextTick(); primary.value?.focus(); } });
      onMounted(() => { persist(); window.addEventListener('keydown', key); nextTick(() => focusCell(selected.value)); });
      onUnmounted(() => window.removeEventListener('keydown', key));
      function trap(event) {
        const controls = Array.from(event.currentTarget.querySelectorAll('button,select'));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return { difficulty, puzzle, values, notes, selected, noteMode, help, confirmNew, completed, storageAvailable, history, board, primary, nextDifficulty, errors, solved, filled, editable, fresh, focusCell, enter, undo, requestNew, cancelNew, trap, peers: SudokuRules.peers };
    },
    template: `
      <main class="play-page sudoku-page">
        <div class="play-topbar"><a class="back-link topbar-button icon-button" href="#/" :title="t('game.back')" :aria-label="t('game.back')"><svg class="back-arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg></a><div class="topbar-actions">
          <button class="topbar-button icon-button sudoku-new" @click="requestNew" :title="t('game.new') + ' (N)'" :aria-label="t('game.new')"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.4 6M20 4v7h-7"/></svg></button>
          <button class="topbar-button icon-button" @click="help = !help" :aria-expanded="help" aria-controls="sudoku-help" :title="t(help ? 'guide.hide' : 'guide.show') + ' (H)'" :aria-label="t(help ? 'guide.hide' : 'guide.show')"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3Z"/><path d="M8 7h8M8 11h6M8 3v14"/></svg></button>
        </div></div>
        <div class="sudoku-layout"><section aria-labelledby="sudoku-title">
          <div class="sudoku-heading"><div><p class="eyebrow">{{ t('card.category') }}</p><h1 id="sudoku-title">Sudoku</h1><p>{{ t('sudoku.' + difficulty) }}</p></div><div class="scores"><div><span>{{ t('sudoku.filled') }}</span><strong>{{ formatTile(filled) }}/{{ formatTile(81) }}</strong></div></div></div>
          <div class="sudoku-wrap"><div ref="board" class="sudoku-board" role="group" :aria-label="t('sudoku.board')" :inert="confirmNew">
            <button v-for="(value, index) in values" :key="index" class="sudoku-cell" :class="{ given: puzzle[index], selected: selected === index, related: peers[selected]?.includes(index), matching: value && value === values[selected], conflict: errors.has(index), 'block-right': index % 9 === 2 || index % 9 === 5, 'block-bottom': Math.floor(index / 9) === 2 || Math.floor(index / 9) === 5 }" :tabindex="selected === index ? 0 : -1" :aria-label="t('game.cell', { row: formatTile(Math.floor(index / 9) + 1), column: formatTile(index % 9 + 1), value: value ? formatTile(value) : t('game.empty') }) + (puzzle[index] ? ', ' + t('sudoku.given') : '')" :aria-pressed="selected === index" @focus="selected = index" @click="focusCell(index)">
              <span v-if="value">{{ formatTile(value) }}</span><span v-else class="sudoku-notes" aria-hidden="true"><span v-for="digit in 9" :key="digit">{{ notes[index] & (1 << (digit - 1)) ? formatTile(digit) : '' }}</span></span>
            </button>
          </div>
          <div v-if="confirmNew" class="board-overlay sudoku-dialog" role="dialog" aria-modal="true" :aria-label="t('dialog.restart.title')" @keydown.tab="trap">
            <h2>{{ t('dialog.restart.title') }}</h2><label>{{ t('sudoku.difficulty') }} <select v-model="nextDifficulty"><option v-for="level in ['easy','medium','hard']" :value="level" :key="level">{{ t('sudoku.' + level) }}</option></select></label>
            <button ref="primary" class="primary-button" @click="fresh">{{ t('dialog.start') }}</button><button class="text-button" @click="cancelNew">{{ t('sudoku.cancel') }}</button>
          </div></div>
          <p class="sudoku-status" aria-live="polite">{{ solved ? t('sudoku.won') : errors.size ? t('sudoku.conflict') : t('sudoku.select') }}</p>
          <div class="sudoku-digits" :inert="confirmNew"><button v-for="digit in 9" :key="digit" class="topbar-button" :disabled="!editable || solved" @click="enter(digit)" :aria-label="t('sudoku.enter', { value: formatTile(digit) })">{{ formatTile(digit) }}</button></div>
          <div class="sudoku-tools" :inert="confirmNew"><button class="topbar-button" :disabled="!editable || solved" @click="enter(0)">{{ t('sudoku.erase') }}</button><button class="topbar-button" :aria-pressed="noteMode" @click="noteMode = !noteMode" :title="t('sudoku.notes') + ' (P)'">{{ t('sudoku.notes') }}</button><button class="topbar-button" :disabled="!history.length || solved" @click="undo">{{ t('game.undo') }}</button></div>
          <p v-if="!storageAvailable" class="save-note">{{ t('sudoku.storage') }}</p>
        </section><aside v-show="help" id="sudoku-help" class="sudoku-help"><h2>{{ t('sudoku.helpTitle') }}</h2><p>{{ t('sudoku.rules') }}</p><p>{{ t('sudoku.controls') }}</p><p>{{ t('sudoku.notesHelp') }}</p><p>{{ t('sudoku.unique') }}</p><p>{{ t('sudoku.completed') }}: {{ formatTile(completed) }}</p></aside></div>
      </main>`
  };
})(globalThis);
