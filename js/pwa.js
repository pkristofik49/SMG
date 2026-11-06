/* Offline support is optional; opening the HTML directly still works. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator) || !['https:', 'http:'].includes(location.protocol)) return;
  const workerUrl = new URL('../sw.js', document.currentScript.src);
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(workerUrl.href, { updateViaCache: 'none' });
      // Updates wait until every window using the previous worker has closed.
      const checkForUpdate = () => {
        if (!document.hidden) registration.update().catch(() => {});
      };
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('online', checkForUpdate);
    } catch { /* The game remains usable if offline registration is unavailable. */ }
  }, { once: true });
})();
