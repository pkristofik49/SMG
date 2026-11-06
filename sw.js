'use strict';

// Bump this version whenever a cached application file changes.
const RELEASE = 'v1';
const CACHE_PREFIX = `little-arcade:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}${RELEASE}`;
const appUrl = path => new URL(path, self.registration.scope).href;
const SHELL = [
  './index.html', './styles.css', './themes.css', './manifest.webmanifest',
  './vendor/vue.global.prod.js', './js/game2048.js', './js/speedy-clock.js',
  './js/translations.js', './js/audio.js', './js/app.js', './js/pwa.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
].map(appUrl);
const SHELL_URLS = new Set(SHELL);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // A release is usable only after its entire shell has been downloaded.
      await cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isAppNavigation = event.request.mode === 'navigate' &&
    (url.origin + url.pathname === appUrl('./') || url.origin + url.pathname === appUrl('./index.html'));
  const resource = isAppNavigation ? appUrl('./index.html') : url.href;
  if (!SHELL_URLS.has(resource)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(resource) || fetch(event.request);
  })());
});
