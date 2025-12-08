// Service Worker for PWA
const CACHE_NAME = 'schoolbus-v5';
const SW_VERSION = '5.0.0';
console.log(`🔄 Service Worker version ${SW_VERSION} loaded - ${new Date().toISOString()}`);

// Workbox precache manifest injection point
self.__WB_MANIFEST;

// Install event
self.addEventListener('install', (event) => {
  console.log(`Service Worker ${SW_VERSION}: Installing...`);
  // 즉시 활성화
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log(`Service Worker ${SW_VERSION}: Activating...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log(`Service Worker ${SW_VERSION}: Activated and claiming clients`);
      return self.clients.claim();
    })
  );
});

// Fetch event - 캐싱 비활성화 (개발 중)
self.addEventListener('fetch', (event) => {
  // 모든 요청을 네트워크에서 직접 가져옴
  event.respondWith(fetch(event.request));
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received', event);
  console.log('📦 Push event:', {
    hasData: !!event.data,
    type: event.data ? typeof event.data : 'undefined'
  });
  
  let notificationData = {
    title: '통학버스 알림',
    body: '새로운 알림이 있습니다',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    tag: 'bus-notification-' + Date.now(),
    requireInteraction: true,
    data: { timestamp: Date.now() }
  };

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      // 먼저 텍스트로 확인
      const textData = event.data.text();
      console.log('📝 Raw text data:', textData);
      
      // JSON 파싱 시도
      const payload = event.data.json();
      console.log('✅ Parsed JSON payload:', payload);
      
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        vibrate: payload.vibrate || notificationData.vibrate,
        tag: payload.tag || notificationData.tag,
        requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : true,
        data: payload.data || notificationData.data
      };
    } catch (e) {
      console.error('❌ Push data parsing failed:', e);
      // 파싱 실패해도 기본 알림은 표시
      try {
        notificationData.body = event.data.text() || notificationData.body;
      } catch (textError) {
        console.error('❌ Failed to get text:', textError);
      }
    }
  } else {
    console.warn('⚠️ No data in push event - showing default notification');
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
    return true;
  }).catch((error) => {
    console.error('❌ Failed to show notification:', error);
    // 에러가 나도 기본 알림 시도
    return self.registration.showNotification('통학버스', {
      body: '새 알림',
      tag: 'fallback-' + Date.now()
    });
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
