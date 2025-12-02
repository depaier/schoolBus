// Push Notification 유틸리티
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
 * iOS PWA (Standalone) 모드 감지
 */
export const isIOSStandalone = () => {
  return ('standalone' in window.navigator) && window.navigator.standalone;
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
    
    console.log('푸시 토큰 저장 시도:', {
      url: `${API_BASE_URL}/api/users/${studentId}/token`,
      studentId,
      deviceType,
      token: token.substring(0, 20) + '...',
      payload
    });
    
    const response = await axios.post(
      `${API_BASE_URL}/api/users/${studentId}/token`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('푸시 토큰 저장 성공:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('푸시 토큰 저장 실패:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_BASE_URL}/api/users/${studentId}/token`
    });
    
    // 사용자에게 더 명확한 에러 메시지
    if (error.response) {
      throw new Error(`서버 오류 (${error.response.status}): ${error.response.data?.detail || error.message}`);
    } else if (error.request) {
      throw new Error('네트워크 오류: 서버에 연결할 수 없습니다. ngrok URL을 확인해주세요.');
    } else {
      throw new Error(`토큰 저장 실패: ${error.message}`);
    }
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
    
    // 2. iOS PWA 특별 처리
    const deviceType = getDeviceType();
    const isStandalone = isIOSStandalone();
    
    if (deviceType === 'ios') {
      console.log('iOS 디바이스 감지:', {
        standalone: isStandalone,
        notificationAPI: 'Notification' in window,
        permission: Notification.permission,
        userAgent: navigator.userAgent
      });
      
      // iOS의 Web Push API 제한사항 안내
      if (!isStandalone) {
        throw new Error(
          'iOS에서는 홈 화면에 추가된 앱에서만 알림을 받을 수 있습니다.\n\n' +
          '📱 홈 화면에 추가하는 방법:\n' +
          '1. Safari 하단의 공유 버튼(□↑) 탭\n' +
          '2. "홈 화면에 추가" 선택\n' +
          '3. 추가된 앱 아이콘으로 실행\n' +
          '4. 다시 알림 받기 버튼 클릭\n\n' +
          '⚠️ 참고: iOS는 백그라운드 푸시 알림을 지원하지 않습니다.\n' +
          '앱이 실행 중일 때만 알림을 받을 수 있습니다.'
        );
      }
      
      // Standalone 모드에서도 제한사항 경고
      console.warn(
        'iOS PWA 알림 제한사항:\n' +
        '- 앱이 포그라운드에서 실행 중일 때만 알림 표시\n' +
        '- 백그라운드 푸시 알림 미지원\n' +
        '- 네이티브 앱과 동일한 기능을 원하시면 App Store 앱 사용 권장'
      );
    }
    
    // 3. 알림 권한 요청
    let permission;
    
    // iOS에서는 권한 요청이 다를 수 있음
    if (deviceType === 'ios') {
      // iOS는 자동으로 권한 다이얼로그를 표시하지 않을 수 있음
      permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
    } else {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다.');
    }
    
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
