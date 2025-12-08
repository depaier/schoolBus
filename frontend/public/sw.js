// Service Worker for PWA
const CACHE_NAME = 'schoolbus-v3';
const SW_VERSION = '3.0.0';
console.log(`Service Worker version ${SW_VERSION} loaded`);

// Install event - 캐싱 비활성화 (개발 중)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // 즉시 활성화
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - 캐싱 비활성화 (개발 중)
self.addEventListener('fetch', (event) => {
  // 모든 요청을 네트워크에서 직접 가져옴
  event.respondWith(fetch(event.request));
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received', event);
  console.log('📦 Push event data:', event.data ? event.data.text() : 'No data');
  
  let notificationData = {
    title: '통학버스 알림',
    body: '새로운 알림이 있습니다',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'bus-notification',
    requireInteraction: true,
    data: {}
  };

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('✅ Parsed payload:', payload);
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        vibrate: payload.vibrate || notificationData.vibrate,
        tag: payload.tag || notificationData.tag,
        requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : true,
        data: payload.data || {}
      };
    } catch (e) {
      console.error('❌ Push data parsing failed:', e);
      notificationData.body = event.data.text();
    }
  }

  console.log('📢 Showing notification:', notificationData);

  const showNotificationPromise = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: notificationData.vibrate,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    data: notificationData.data
  }).then(() => {
    console.log('✅ Notification shown successfully');
  }).catch((error) => {
    console.error('❌ Failed to show notification:', error);
  });

  event.waitUntil(showNotificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
