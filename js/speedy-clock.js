/* A monotonic countdown: each accepted move adds one second to the remainder. */
(function (root) {
  'use strict';
  root.createSpeedyClock = function (now = () => performance.now()) {
    let balance = 2000, deadline = null;
    function remaining() { return deadline === null ? balance : Math.max(0, deadline - now()); }
    return {
      remaining,
      isRunning() { return deadline !== null; },
      reset(milliseconds = 2000) { balance = Math.max(0, milliseconds); deadline = null; },
      start() { if (deadline === null && balance > 0) deadline = now() + balance; },
      pause() { balance = remaining(); deadline = null; return balance; },
      reward() {
        const left = remaining();
        if (left <= 0) return false;
        balance = left + 1000;
        if (deadline !== null) deadline = now() + balance;
        return true;
      }
    };
  };
})(globalThis);
