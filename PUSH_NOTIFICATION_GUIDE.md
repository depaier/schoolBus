# 푸시 알림 토큰 발급 및 저장 가이드

## ✅ 구현 완료 사항

### 1. 디바이스 타입 자동 감지
- **iOS**: APN (Apple Push Notification) 토큰 발급
- **Android**: FCM (Firebase Cloud Messaging) 토큰 발급
- **Web/Desktop**: FCM 토큰 발급

### 2. 토큰 발급 및 저장 흐름
```
사용자 "알림 받기" 클릭
    ↓
학번 입력 (prompt)
    ↓
디바이스 타입 감지 (iOS/Android/Web)
    ↓
토큰 생성 (FCM 또는 APN)
    ↓
POST /api/users/{student_id}/token
    ↓
Supabase users 테이블에 저장
    ↓
테스트 알림 전송
```

## 📁 파일 구조

### 프론트엔드
```
frontend/src/
├── utils/
│   └── pushNotification.js       # 푸시 토큰 유틸리티
├── firebase-config.js             # Firebase 설정 (템플릿)
└── pages/
    └── Home.jsx                   # 알림 설정 UI
```

### 백엔드
```
backend/api/routes/
└── users.py                       # 토큰 저장 API
```

## 🎯 주요 기능

### 1. 디바이스 타입 감지 (`getDeviceType()`)
```javascript
// iOS 감지
if (/iPad|iPhone|iPod/.test(userAgent)) {
  return 'ios';
}

// Android 감지
if (/android/i.test(userAgent)) {
  return 'android';
}

// 기타 (Web)
return 'web';
```

### 2. FCM 토큰 생성 (`generateFCMToken()`)
- **현재**: 임시 랜덤 토큰 생성 (개발용)
- **실제**: Firebase SDK 사용 필요

```javascript
// 개발용 (현재)
const tempToken = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 실제 구현 (Firebase SDK 필요)
// import { getMessaging, getToken } from 'firebase/messaging';
// const messaging = getMessaging();
// const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
```

### 3. APN 토큰 생성 (`generateAPNToken()`)
- **현재**: 임시 랜덤 토큰 생성 (개발용)
- **실제**: iOS 네이티브 앱 필요

```javascript
// 개발용 (현재)
const tempToken = `apn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 실제 구현 (iOS 네이티브 앱 필요)
// iOS 앱에서 APNs 토큰을 받아와야 함
```

### 4. 토큰 저장 (`savePushToken()`)
```javascript
// iOS인 경우
POST /api/users/{student_id}/token
{
  "apn_token": "apn_1234567890_abc123"
}

// Android/Web인 경우
POST /api/users/{student_id}/token
{
  "fcm_token": "fcm_1234567890_xyz789"
}
```

## 🔧 사용 방법

### 1. 프론트엔드에서 알림 설정

#### 홈 페이지 접속
```
http://localhost:5173/
```

#### "알림 받기" 버튼 클릭
1. 학번 입력 프롬프트 표시
2. 학번 입력 (예: `20240001`)
3. 디바이스 타입 자동 감지
4. 토큰 자동 생성
5. 서버에 토큰 저장
6. 테스트 알림 전송

#### 알림 확인
- 브라우저 알림 권한 허용 필요
- 테스트 알림: "✅ 알림 설정 완료!"
- 디바이스 타입과 토큰 정보 표시

### 2. 백엔드 API 테스트

#### FCM 토큰 저장 (Android/Web)
```bash
curl -X POST http://localhost:8000/api/users/20240001/token \
  -H "Content-Type: application/json" \
  -d '{
    "fcm_token": "fcm_1234567890_test123"
  }'
```

#### APN 토큰 저장 (iOS)
```bash
curl -X POST http://localhost:8000/api/users/20240001/token \
  -H "Content-Type: application/json" \
  -d '{
    "apn_token": "apn_1234567890_test456"
  }'
```

#### 성공 응답
```json
{
  "message": "푸시 토큰이 업데이트되었습니다.",
  "student_id": "20240001",
  "token_type": "fcm"  // 또는 "apn"
}
```

### 3. Supabase에서 확인

#### SQL 쿼리
```sql
-- 모든 사용자의 토큰 확인
SELECT student_id, name, fcm_token, apn_token, notification_enabled 
FROM users 
WHERE fcm_token IS NOT NULL OR apn_token IS NOT NULL;

-- 특정 사용자 토큰 확인
SELECT * FROM users WHERE student_id = '20240001';
```

#### Table Editor
1. Supabase 대시보드 접속
2. Table Editor 선택
3. `users` 테이블 확인
4. `fcm_token` 또는 `apn_token` 컬럼 확인

## 📊 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    fcm_token TEXT,              -- Firebase Cloud Messaging 토큰
    apn_token TEXT,              -- Apple Push Notification 토큰
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 토큰 업데이트 로직

### 백엔드 API (users.py)
```python
class PushTokenUpdate(BaseModel):
    fcm_token: Optional[str] = None
    apn_token: Optional[str] = None

@router.post("/users/{student_id}/token")
async def update_push_token(student_id: str, token_data: PushTokenUpdate):
    update_data = {}
    if token_data.fcm_token:
        update_data["fcm_token"] = token_data.fcm_token
    if token_data.apn_token:
        update_data["apn_token"] = token_data.apn_token
    
    updated = supabase.table("users").update(update_data).eq("student_id", student_id).execute()
    
    return {
        "message": "푸시 토큰이 업데이트되었습니다.",
        "student_id": student_id,
        "token_type": "apn" if token_data.apn_token else "fcm"
    }
```

## 🚀 실제 Firebase 설정 (선택사항)

### 1. Firebase 프로젝트 생성
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `schoolbus-notification`)
4. Google Analytics 설정 (선택)

### 2. 웹 앱 추가
1. 프로젝트 설정 > 일반 탭
2. "앱 추가" > 웹 아이콘 선택
3. 앱 닉네임 입력
4. Firebase SDK 구성 정보 복사

### 3. Cloud Messaging 설정
1. 프로젝트 설정 > Cloud Messaging 탭
2. "웹 푸시 인증서" 생성
3. VAPID 키 복사

### 4. Firebase SDK 설치
```bash
cd frontend
npm install firebase
```

### 5. firebase-config.js 수정
```javascript
export const firebaseConfig = {
  apiKey: "실제_API_KEY",
  authDomain: "프로젝트_ID.firebaseapp.com",
  projectId: "프로젝트_ID",
  storageBucket: "프로젝트_ID.appspot.com",
  messagingSenderId: "실제_SENDER_ID",
  appId: "실제_APP_ID"
};

export const vapidKey = "실제_VAPID_KEY";
```

### 6. pushNotification.js 수정
```javascript
// 임시 토큰 생성 코드 제거
// Firebase SDK 코드 활성화

import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { firebaseConfig, vapidKey } from '../firebase-config';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const generateFCMToken = async () => {
  const token = await getToken(messaging, { vapidKey });
  return token;
};
```

## 🍎 iOS APN 설정 (선택사항)

### 1. Apple Developer 계정 필요
- https://developer.apple.com/

### 2. Push Notification 인증서 생성
1. Apple Developer > Certificates, Identifiers & Profiles
2. Keys 생성
3. Apple Push Notifications service (APNs) 활성화

### 3. iOS 네이티브 앱 필요
- React Native 또는 Swift로 앱 개발
- APNs 토큰 받아오기
- 웹뷰로 토큰 전달

## 📱 테스트 시나리오

### 시나리오 1: Android 사용자
1. Android 기기에서 접속
2. "알림 받기" 클릭
3. 학번 입력: `20240001`
4. FCM 토큰 자동 생성
5. Supabase `fcm_token` 컬럼에 저장
6. 테스트 알림 수신

### 시나리오 2: iOS 사용자
1. iPhone에서 접속
2. "알림 받기" 클릭
3. 학번 입력: `20240002`
4. APN 토큰 자동 생성
5. Supabase `apn_token` 컬럼에 저장
6. 테스트 알림 수신

### 시나리오 3: 데스크톱 사용자
1. Chrome/Firefox에서 접속
2. "알림 받기" 클릭
3. 학번 입력: `20240003`
4. FCM 토큰 자동 생성
5. Supabase `fcm_token` 컬럼에 저장
6. 테스트 알림 수신

## 🔍 디버깅

### 브라우저 콘솔 확인
```javascript
// 디바이스 타입 확인
console.log('Device Type:', getDeviceType());

// 토큰 정보 확인
console.log('Push Token Info:', pushTokenInfo);

// 학번 확인
console.log('Student ID:', currentStudentId);
```

### 네트워크 탭 확인
1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭 선택
3. "알림 받기" 클릭
4. `POST /api/users/{student_id}/token` 요청 확인
5. Request Payload 확인
6. Response 확인

### Supabase 로그 확인
1. Supabase 대시보드
2. Logs 섹션
3. API 요청 로그 확인

## ⚠️ 주의사항

### 현재 구현 (개발용)
- ✅ 디바이스 타입 자동 감지
- ✅ 임시 토큰 생성 (랜덤)
- ✅ Supabase에 토큰 저장
- ✅ 브라우저 알림 (Web Notification API)

### 실제 프로덕션 환경
- ⚠️ Firebase SDK 설정 필요 (FCM)
- ⚠️ iOS 네이티브 앱 필요 (APN)
- ⚠️ 서버에서 실제 푸시 알림 전송 로직 필요
- ⚠️ 토큰 갱신 로직 필요
- ⚠️ 보안 강화 (HTTPS, 인증)

## 🔐 보안 고려사항

### 1. 학번 인증
- 현재: prompt로 학번 입력
- 개선: 로그인 시스템 구현 필요

### 2. 토큰 보안
- Supabase RLS (Row Level Security) 활성화
- HTTPS 사용
- 토큰 암호화 저장 고려

### 3. API 보안
- Rate Limiting 적용
- JWT 인증 추가
- CORS 설정 확인

## 📚 참고 자료

### Firebase Cloud Messaging (FCM)
- https://firebase.google.com/docs/cloud-messaging

### Apple Push Notification (APN)
- https://developer.apple.com/documentation/usernotifications

### Web Push API
- https://developer.mozilla.org/en-US/docs/Web/API/Push_API

### Supabase
- https://supabase.com/docs

## 🎉 완료!

알림 허용 시 디바이스 타입에 따라 FCM 또는 APN 토큰이 자동으로 발급되고 Supabase에 저장됩니다!

### 다음 단계
1. **Firebase 설정**: 실제 FCM 토큰 발급
2. **iOS 앱 개발**: 실제 APN 토큰 발급
3. **서버 푸시 전송**: 백엔드에서 실제 푸시 알림 전송
4. **로그인 시스템**: 학번 인증 자동화
5. **토큰 갱신**: 만료된 토큰 자동 갱신
