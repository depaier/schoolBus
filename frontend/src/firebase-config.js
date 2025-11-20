// Firebase Configuration
// 실제 Firebase를 사용하려면 Firebase Console에서 프로젝트를 생성하고
// 아래 설정을 실제 값으로 교체해야 합니다.

// TODO: Firebase Console에서 프로젝트 생성 후 설정 값 입력
// https://console.firebase.google.com/

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// VAPID Key (Web Push Certificate)
// Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
export const vapidKey = "YOUR_VAPID_KEY";

/*
Firebase 설정 가이드:

1. Firebase Console 접속
   https://console.firebase.google.com/

2. 프로젝트 생성
   - "프로젝트 추가" 클릭
   - 프로젝트 이름 입력 (예: schoolbus-notification)
   - Google Analytics 설정 (선택사항)

3. 웹 앱 추가
   - 프로젝트 설정 > 일반 탭
   - "앱 추가" > 웹 아이콘 선택
   - 앱 닉네임 입력
   - Firebase SDK 구성 정보 복사

4. Cloud Messaging 설정
   - 프로젝트 설정 > Cloud Messaging 탭
   - "웹 푸시 인증서" 생성
   - VAPID 키 복사

5. 패키지 설치
   npm install firebase

6. 이 파일의 설정값 교체
   - firebaseConfig 객체의 모든 값
   - vapidKey 값

7. pushNotification.js에서 Firebase 사용
   - 주석 처리된 Firebase 코드 활성화
   - 임시 토큰 생성 코드 제거
*/
