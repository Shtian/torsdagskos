self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = {
    title: 'Torsdagskos',
    body: 'You have a new notification.',
    url: '/',
  };

  try {
    const parsed = event.data.json();
    payload = {
      title: parsed?.title || payload.title,
      body: parsed?.body || payload.body,
      url: parsed?.url || payload.url,
    };
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: {
        url: payload.url,
      },
      badge: '/favicon.ico',
      icon: '/favicon.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client && client.url.includes(self.location.origin)) {
            if ('navigate' in client) {
              return client
                .navigate(targetUrl)
                .then((navigatedClient) => navigatedClient?.focus());
            }
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});
