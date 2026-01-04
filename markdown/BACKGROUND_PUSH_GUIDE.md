# 백그라운드 푸시 알림 구현 가이드

## 현재 상황

**문제:** 앱이 꺼져있거나 백그라운드에 있을 때 알림을 받을 수 없음

**원인:**
- 현재는 브라우저(클라이언트)에서만 알림을 생성
- 브라우저가 닫히면 JavaScript 실행 중단
- 폴링도 중단되어 상태 변경 감지 불가

## 해결 방법

백그라운드 푸시 알림을 받으려면 **서버에서 푸시 알림을 전송**해야 합니다.

### 아키텍처

```
[관리자] 예매 오픈
    ↓
[백엔드] reservation_status 업데이트
    ↓
[백엔드] 알림 서비스 트리거
    ↓
[Firebase/APNs] 푸시 알림 전송
    ↓
[사용자 기기] 알림 수신 (앱 꺼져있어도 OK!)
```

## 구현 단계

### 1단계: Firebase 프로젝트 설정

#### 1.1 Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 설정 > 서비스 계정
4. "새 비공개 키 생성" 클릭
5. JSON 파일 다운로드 → `backend/firebase-admin-key.json`으로 저장

#### 1.2 Firebase 웹 앱 등록

1. Firebase Console > 프로젝트 설정
2. "웹 앱 추가" 클릭
3. 앱 닉네임 입력 (예: "SchoolBus Web")
4. Firebase SDK 구성 정보 복사:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```

#### 1.3 Cloud Messaging 활성화

1. Firebase Console > Cloud Messaging
2. "Cloud Messaging API (Legacy)" 활성화
3. 서버 키 복사 (나중에 사용)

### 2단계: 백엔드 구현

#### 2.1 Firebase Admin SDK 설치

```bash
cd backend
pip install firebase-admin
```

`requirements.txt`에 추가:
```
firebase-admin==6.3.0
```

#### 2.2 푸시 알림 서비스 생성

`backend/services/push_notification_service.py`:

```python
import firebase_admin
from firebase_admin import credentials, messaging
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class PushNotificationService:
    def __init__(self, credentials_path: str = "firebase-admin-key.json"):
        """Firebase Admin SDK 초기화"""
        try:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK 초기화 완료")
        except Exception as e:
            logger.error(f"Firebase 초기화 실패: {e}")
    
    async def send_to_token(self, token: str, title: str, body: str, data: Dict[str, str] = None) -> bool:
        """단일 토큰으로 푸시 알림 전송"""
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                token=token,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/icon.png',
                        badge='/badge.png',
                        vibrate=[200, 100, 200],
                        require_interaction=True,
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link='/'
                    )
                )
            )
            
            response = messaging.send(message)
            logger.info(f"푸시 알림 전송 성공: {response}")
            return True
            
        except Exception as e:
            logger.error(f"푸시 알림 전송 실패: {e}")
            return False
    
    async def send_to_multiple(self, tokens: List[str], title: str, body: str, data: Dict[str, str] = None) -> Dict[str, Any]:
        """여러 토큰으로 푸시 알림 전송"""
        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                tokens=tokens,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/icon.png',
                        badge='/badge.png',
                        vibrate=[200, 100, 200],
                    )
                )
            )
            
            response = messaging.send_multicast(message)
            logger.info(f"멀티캐스트 알림 전송: 성공 {response.success_count}, 실패 {response.failure_count}")
            
            return {
                "success_count": response.success_count,
                "failure_count": response.failure_count,
                "responses": response.responses
            }
            
        except Exception as e:
            logger.error(f"멀티캐스트 알림 전송 실패: {e}")
            return {"success_count": 0, "failure_count": len(tokens), "error": str(e)}
    
    async def send_to_all_users(self, supabase_client, title: str, body: str) -> Dict[str, Any]:
        """알림이 활성화된 모든 사용자에게 푸시 알림 전송"""
        try:
            # Supabase에서 알림 활성화된 사용자의 FCM 토큰 조회
            response = supabase_client.table("users").select("fcm_token").eq("notification_enabled", True).execute()
            
            if not response.data:
                logger.warning("알림 활성화된 사용자가 없습니다")
                return {"success_count": 0, "failure_count": 0, "message": "No users to notify"}
            
            # FCM 토큰 추출 (None이 아닌 것만)
            tokens = [user["fcm_token"] for user in response.data if user.get("fcm_token")]
            
            if not tokens:
                logger.warning("유효한 FCM 토큰이 없습니다")
                return {"success_count": 0, "failure_count": 0, "message": "No valid tokens"}
            
            logger.info(f"{len(tokens)}명의 사용자에게 푸시 알림 전송 시도")
            
            # 멀티캐스트로 전송
            return await self.send_to_multiple(tokens, title, body)
            
        except Exception as e:
            logger.error(f"전체 사용자 알림 전송 실패: {e}")
            return {"success_count": 0, "failure_count": 0, "error": str(e)}
```

#### 2.3 예매 상태 업데이트 시 자동 알림

`backend/api/routes/reservation.py` 수정:

```python
from services.push_notification_service import PushNotificationService

# 전역 인스턴스
push_service = PushNotificationService()

@router.post("/reservation/update")
async def update_reservation_status(body: ReservationUpdate):
    """예매 상태 변경 (열림/닫힘) - Supabase"""
    try:
        # 첫 번째 레코드 조회
        response = supabase.table("reservation_status").select("id, is_open").limit(1).execute()
        
        if response.data and len(response.data) > 0:
            status_id = response.data[0]["id"]
            previous_status = response.data[0]["is_open"]
            
            # 기존 레코드 업데이트
            updated = supabase.table("reservation_status").update({
                "is_open": body.is_open,
                "updated_at": datetime.now().isoformat()
            }).eq("id", status_id).execute()
            
            # 🔥 닫혀있었는데 열린 경우 푸시 알림 전송
            if not previous_status and body.is_open:
                logger.info("예매 오픈 감지 - 푸시 알림 전송 시작")
                result = await push_service.send_to_all_users(
                    supabase,
                    "🎉 통학버스 예매 오픈!",
                    "통학버스 예매가 오픈되었습니다. 지금 바로 예매하세요!"
                )
                logger.info(f"푸시 알림 전송 결과: {result}")
            
            return {
                "message": "예매 상태가 변경되었습니다.",
                "state": {
                    "is_open": body.is_open,
                    "updated_at": updated.data[0]["updated_at"]
                }
            }
        # ... 나머지 코드
```

### 3단계: 프론트엔드 Service Worker

#### 3.1 Firebase SDK 설치

```bash
cd frontend
npm install firebase
```

#### 3.2 Firebase 설정

`frontend/src/firebase-config.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export { messaging, getToken, onMessage }
```

#### 3.3 Service Worker 생성

`frontend/public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
})

const messaging = firebase.messaging()

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload)
  
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: payload.data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})
```

#### 3.4 토큰 발급 수정

`frontend/src/utils/pushNotification.js` 수정:

```javascript
import { messaging, getToken } from '../firebase-config'

export async function requestNotificationWithToken(studentId) {
  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      // FCM 토큰 발급
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Firebase Console에서 생성
      })
      
      console.log('FCM 토큰:', token)
      
      // 백엔드에 토큰 저장
      await axios.post(`${API_BASE_URL}/api/users/update-token`, {
        student_id: studentId,
        fcm_token: token,
        device_type: getDeviceType()
      })
      
      return { permission, token, deviceType: getDeviceType() }
    }
    
    throw new Error('알림 권한이 거부되었습니다')
  } catch (err) {
    console.error('토큰 발급 실패:', err)
    throw err
  }
}
```

## 플랫폼별 제한사항

### 웹 (PC/Android)
- ✅ 백그라운드 푸시 알림 완전 지원
- ✅ 브라우저 꺼져있어도 알림 수신
- ✅ Service Worker 통해 처리

### iOS Safari
- ⚠️ **백그라운드 푸시 알림 미지원**
- ⚠️ PWA로 설치해도 제한적
- ⚠️ 앱이 실행 중일 때만 알림 수신
- 💡 네이티브 앱으로 개발해야 완전한 지원

### iOS PWA (홈 화면 추가)
- ⚠️ iOS 16.4+ 부터 일부 지원
- ⚠️ 앱이 포그라운드에 있을 때만
- ⚠️ 백그라운드 알림은 여전히 제한적

## 대안: 이메일/SMS 알림

iOS 사용자를 위한 대안:

```python
# backend/services/notification_service.py
async def send_email_notification(email: str, title: str, body: str):
    """이메일 알림 전송"""
    # SendGrid, AWS SES 등 사용
    pass

async def send_sms_notification(phone: str, message: str):
    """SMS 알림 전송"""
    # Twilio, AWS SNS 등 사용
    pass
```

## 테스트 방법

### 1. 백엔드 테스트

```bash
# Firebase Admin SDK 설치
pip install firebase-admin

# 백엔드 재시작
cd backend
uvicorn main:app --reload
```

### 2. 프론트엔드 테스트

```bash
# Firebase SDK 설치
cd frontend
npm install firebase

# 프론트엔드 재시작
npm run dev
```

### 3. 알림 테스트

1. 브라우저에서 알림 권한 허용
2. FCM 토큰 발급 확인
3. 관리자 페이지에서 예매 오픈
4. 브라우저 최소화 또는 닫기
5. 알림 수신 확인

## 비용

- Firebase Cloud Messaging: **무료**
- 제한: 없음 (무제한 메시지)

## 보안 주의사항

1. `firebase-admin-key.json`을 `.gitignore`에 추가
2. 환경 변수로 민감한 정보 관리
3. VAPID 키는 공개 가능 (Public Key)
4. 서버 키는 절대 노출 금지

## 다음 단계

1. Firebase 프로젝트 생성
2. 백엔드에 Firebase Admin SDK 설정
3. 프론트엔드에 Firebase SDK 설정
4. Service Worker 등록
5. 테스트 및 배포

자세한 구현은 개발자와 함께 진행하는 것을 권장합니다.
