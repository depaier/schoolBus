// Push Notification 유틸리티
import axios from 'axios';

/**
 * 디바이스 타입 감지
 */
export const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // iOS 감지
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  // Android 감지
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // 기타 (데스크톱 등)
  return 'web';
};

/**
 * FCM 토큰 생성 (Android/Web)
 * 실제 FCM을 사용하려면 Firebase SDK가 필요합니다.
 * 현재는 임시 토큰을 생성합니다.
 */
export const generateFCMToken = async () => {
  try {
    // TODO: 실제 Firebase Cloud Messaging 설정 후 구현
    // import { getMessaging, getToken } from 'firebase/messaging';
    // const messaging = getMessaging();
    // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    
    // 임시: 랜덤 토큰 생성 (개발용)
    const tempToken = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('FCM 토큰 생성 (임시):', tempToken);
    return tempToken;
    
  } catch (error) {
    console.error('FCM 토큰 생성 실패:', error);
    throw error;
  }
};

/**
 * APN 토큰 생성 (iOS)
 * 실제 APN을 사용하려면 네이티브 앱이 필요합니다.
 * 현재는 임시 토큰을 생성합니다.
 */
export const generateAPNToken = async () => {
  try {
    // TODO: 실제 Apple Push Notification 설정 후 구현
    // iOS 네이티브 앱에서 토큰을 받아와야 합니다.
    
    // 임시: 랜덤 토큰 생성 (개발용)
    const tempToken = `apn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('APN 토큰 생성 (임시):', tempToken);
    return tempToken;
    
  } catch (error) {
    console.error('APN 토큰 생성 실패:', error);
    throw error;
  }
};

/**
 * 푸시 토큰을 서버에 저장
 */
export const savePushToken = async (studentId, deviceType, token) => {
  try {
    const payload = {};
    
    if (deviceType === 'ios') {
      payload.apn_token = token;
    } else {
      payload.fcm_token = token;
    }
    
    const response = await axios.post(
      `http://localhost:8000/api/users/${studentId}/token`,
      payload
    );
    
    console.log('푸시 토큰 저장 성공:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('푸시 토큰 저장 실패:', error);
    throw error;
  }
};

/**
 * 알림 권한 요청 및 토큰 발급
 */
export const requestNotificationWithToken = async (studentId) => {
  try {
    // 1. 브라우저 알림 권한 확인
    if (!('Notification' in window)) {
      throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
    }
    
    // 2. 알림 권한 요청
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다.');
    }
    
    // 3. 디바이스 타입 확인
    const deviceType = getDeviceType();
    console.log('디바이스 타입:', deviceType);
    
    // 4. 토큰 생성
    let token;
    if (deviceType === 'ios') {
      token = await generateAPNToken();
    } else {
      token = await generateFCMToken();
    }
    
    // 5. 학번이 있으면 서버에 토큰 저장
    if (studentId) {
      await savePushToken(studentId, deviceType, token);
    } else {
      console.warn('학번이 없어 토큰을 저장하지 않습니다. 로그인 후 다시 시도하세요.');
      // 로컬 스토리지에 임시 저장
      localStorage.setItem('pending_push_token', JSON.stringify({
        deviceType,
        token,
        timestamp: Date.now()
      }));
    }
    
    return {
      permission,
      deviceType,
      token
    };
    
  } catch (error) {
    console.error('알림 설정 실패:', error);
    throw error;
  }
};

/**
 * 저장된 토큰 정보 가져오기
 */
export const getSavedTokenInfo = () => {
  const saved = localStorage.getItem('pending_push_token');
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
};

/**
 * 저장된 토큰 정보 삭제
 */
export const clearSavedTokenInfo = () => {
  localStorage.removeItem('pending_push_token');
};
