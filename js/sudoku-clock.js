/* Active solving time excludes closed and paused sessions. */
(function (root) {
  'use strict';
  root.createSudokuClock = function (now = () => performance.now()) {
    let accumulated = 0, startedAt = null;
    function elapsed() { return accumulated + (startedAt === null ? 0 : Math.max(0, now() - startedAt)); }
    function pause() { accumulated = elapsed(); startedAt = null; return accumulated; }
    return { elapsed, pause, start() { if (startedAt === null) startedAt = now(); }, reset(value = 0) { accumulated = Number.isFinite(value) && value >= 0 ? value : 0; startedAt = null; }, isRunning: () => startedAt !== null };
  };
})(globalThis);
