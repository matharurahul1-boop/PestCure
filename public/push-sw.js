/* Imported by the generated service worker: shows push messages and opens the app on tap. */
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'PestCure', {
    body: data.body || '', icon: '/pwa-192x192.png', badge: '/pwa-192x192.png', data: { url: data.url || '/' }, tag: data.tag,
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow(target);
  }));
});
