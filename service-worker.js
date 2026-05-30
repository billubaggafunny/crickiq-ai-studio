// A minimal service worker to enable persistent notifications.
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  // Activate new service worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Take control of all pages under its scope immediately
  event.waitUntil(self.clients.claim());
});

// The main app will call registration.showNotification(), so we don't
// need listeners for 'push' or other events for this feature.
