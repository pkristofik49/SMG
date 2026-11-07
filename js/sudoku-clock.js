/* Active solving time excludes closed and paused sessions. */
(function (root) {
  'use strict';
  root.createSudokuClock = function (now = () => performance.now()) {
    let accumulated = 0, startedAt = null;
    function elapsed() { return accumulated + (startedAt === null ? 0 : Math.max(0, now() - startedAt)); }
    function pause() { accumulated = elapsed(); startedAt = null; return accumulated; }
    return { elapsed, pause, start() { if (startedAt === null) startedAt = now(); }, reset(value = 0) { accumulated = Number.isFinite(value) && value >= 0 ? value : 0; startedAt = null; }, isRunning: () => startedAt !== null };
  };
  root.formatSudokuTime = function (ms, formatNumber = String) {
    if (!Number.isFinite(ms)) return '—';
    const seconds = Math.floor(ms / 1000), pad = value => formatNumber(value).padStart(2, formatNumber(0));
    const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60;
    return (hours ? formatNumber(hours) + ':' : '') + pad(minutes) + ':' + pad(seconds % 60);
  };})(globalThis);
