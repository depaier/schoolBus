// Web Push Notification 유틸리티 (VAPID 기반)
import axios from './axiosConfig';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

/**
 * 디바이스 타입 감지
 */
export const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'web';
};

/**
 * iOS PWA (Standalone) 모드 감지
 */
export const isIOSStandalone = () => {
  return ('standalone' in window.navigator) && window.navigator.standalone;
};

/**
 * Service Worker 등록
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('이 브라우저는 Service Worker를 지원하지 않습니다.');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker 등록 성공:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker 등록 실패:', error);
    throw error;
  }
};

/**
 * VAPID 공개키 가져오기
 */
export const getVapidPublicKey = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/push/vapid-public-key`);
    return response.data.publicKey;
  } catch (error) {
    console.error('VAPID 공개키 조회 실패:', error);
    throw error;
  }
};

/**
 * URL-safe base64를 Uint8Array로 변환
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * 푸시 구독 생성
 */
export const subscribeToPush = async (registration, vapidPublicKey) => {
  try {
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('✅ 푸시 구독 생성 성공:', subscription);
    return subscription;
  } catch (error) {
    console.error('❌ 푸시 구독 생성 실패:', error);
    throw error;
  }
};

/**
 * 푸시 구독 정보를 서버에 저장
 */
export const savePushSubscription = async (studentId, subscription) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/push/subscribe`, {
      student_id: studentId,
      subscription: subscription.toJSON()
    });

    console.log('✅ 푸시 구독 저장 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 푸시 구독 저장 실패:', error);
    throw error;
  }
};

/**
 * 푸시 구독 해제
 */
export const unsubscribeFromPush = async (studentId, registration) => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ 푸시 구독 해제 성공');
    }

    // 서버에서도 구독 정보 삭제
    await axios.post(`${API_BASE_URL}/api/push/unsubscribe`, { student_id: studentId });
    
    return true;
  } catch (error) {
    console.error('❌ 푸시 구독 해제 실패:', error);
    throw error;
  }
};

/**
 * 알림 권한 요청 및 푸시 구독
 */
export const requestNotificationWithToken = async (studentId) => {
  try {
    // 1. 브라우저 지원 확인
    if (!('Notification' in window)) {
      throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('이 브라우저는 Service Worker를 지원하지 않습니다.');
    }

    if (!('PushManager' in window)) {
      throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
    }

    // 2. iOS 제한사항 확인
    const deviceType = getDeviceType();
    if (deviceType === 'ios') {
      console.warn('⚠️ iOS는 백그라운드 푸시 알림을 제한적으로 지원합니다.');
      console.warn('앱이 실행 중일 때만 알림을 받을 수 있습니다.');
    }

    // 3. 알림 권한 요청
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다.');
    }

    // 4. Service Worker 등록
    const registration = await registerServiceWorker();
    
    // Service Worker가 활성화될 때까지 대기
    await navigator.serviceWorker.ready;

    // 5. VAPID 공개키 가져오기
    const vapidPublicKey = await getVapidPublicKey();

    // 6. 푸시 구독 생성
    const subscription = await subscribeToPush(registration, vapidPublicKey);

    // 7. 서버에 구독 정보 저장
    await savePushSubscription(studentId, subscription);

    return {
      permission,
      deviceType,
      subscription: subscription.toJSON()
    };

  } catch (error) {
    console.error('❌ 알림 설정 실패:', error);
    throw error;
  }
};

/**
 * 테스트 알림 전송
 */
export const sendTestNotification = async (studentId, title, body) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/push/test`, {
      student_id: studentId,
      title: title,
      body: body
    });

    console.log('✅ 테스트 알림 전송 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 테스트 알림 전송 실패:', error);
    throw error;
  }
};
