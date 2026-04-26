'use strict';

// Fix #5: Service Worker with skipWaiting() and clients.claim() for proper updates
const CACHE_NAME = '2048-v5';  // Version this for updates

const STATIC_ASSETS = [
  './',
  'index.html',
  'app.js',
  'config.json',
  'version.json',
  'privacy.html',
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'manifest.json',
  'core/constants.js',
  'core/events.js',
  'core/tile.js',
  'core/board.js',
  'core/game.js',
  'core/i18n.js',
  'platform/platform.js',
  'platform/IRenderer.js',
  'platform/IInput.js',
  'platform/IAudio.js',
  'platforms/web-dom/renderer.js',
  'platforms/web-dom/input.js',
  'platforms/web-dom/audio.js',
  'platforms/web-dom/ui.js',
  'platforms/web-dom/styles.css'
];

// Install event - cache assets and activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();  // ✅ Fix #5: Force activate immediately
      })
  );
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((names) => {
        console.log('[SW] Cleaning old caches');
        return Promise.all(
          names
            .filter(name => name.startsWith('2048-') && name !== CACHE_NAME)
            .map(name => {
              console.log(`[SW] Deleting cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();  // ✅ Fix #5: Take control immediately
      })
  );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) {
          console.log(`[SW] Cache hit: ${url.pathname}`);
          return cached;
        }

        console.log(`[SW] Cache miss: ${url.pathname}`);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        throw error;
      })
  );
});

// Message event - allow manual skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Manual skip waiting');
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
