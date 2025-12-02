# Web Push 알림 설정 가이드 (VAPID 기반)

## 완료된 작업 ✅

1. ✅ 백엔드 라이브러리 설치 (`pywebpush`, `py-vapid`)
2. ✅ Web Push 서비스 구현 (`services/web_push_service.py`)
3. ✅ 푸시 알림 API 엔드포인트 추가 (`api/routes/push_notification.py`)
4. ✅ 예매 오픈 시 자동 알림 전송 로직 추가
5. ✅ Service Worker 업데이트 (`frontend/public/sw.js`)
6. ✅ 프론트엔드 Web Push 유틸리티 추가 (`frontend/src/utils/webPushNotification.js`)

## 설정 단계

### 1. VAPID 키 생성

```bash
cd backend
source venv/bin/activate
python generate_vapid_keys.py
```

출력 예시:
```
================================================================================
VAPID 키 생성 완료!
================================================================================

다음 내용을 backend/.env 파일에 추가하세요:

VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI
VAPID_PRIVATE_KEY_PEM='-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2mmhlUF8sf7nu43O
PqMnlnLU8Xs+Re4pZNHprvXTvnChRANCAARXJNdc12xDjXo51kQOXPhN5LVPKOdn
v7cXZnmg0VUwM8EBEEshyz0wSYgiIJbuA4ahbv/lhqZ/gWjUzrwuMTiS
-----END PRIVATE KEY-----'

================================================================================

다음 내용을 frontend/.env 파일에 추가하세요:

VITE_VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI

================================================================================
```

### 2. 백엔드 .env 파일 설정

`backend/.env` 파일에 VAPID 키 추가:

```bash
# 기존 설정...
SUPABASE_URL=...
SUPABASE_KEY=...

# VAPID 키 추가
VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI
VAPID_PRIVATE_KEY_PEM='-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2mmhlUF8sf7nu43O
PqMnlnLU8Xs+Re4pZNHprvXTvnChRANCAARXJNdc12xDjXo51kQOXPhN5LVPKOdn
v7cXZnmg0VUwM8EBEEshyz0wSYgiIJbuA4ahbv/lhqZ/gWjUzrwuMTiS
-----END PRIVATE KEY-----'
```

⚠️ **주의**: 비공개키는 절대 공개하지 마세요!

### 3. 프론트엔드 .env 파일 설정

`frontend/.env` 파일에 공개키만 추가:

```bash
VITE_API_URL=https://778ee6360c4d.ngrok-free.app
VITE_VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI
```

### 4. Supabase 데이터베이스 스키마 업데이트

`users` 테이블에 `push_subscription` 컬럼 추가:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_subscription JSONB,
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false;
```

Supabase Dashboard에서 실행:
1. SQL Editor 열기
2. 위 SQL 실행
3. 성공 확인

### 5. 백엔드 재시작

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### 6. 프론트엔드 재시작

```bash
cd frontend
npm run dev
```

## 사용 방법

### 프론트엔드에서 알림 활성화

기존 `pushNotification.js` 대신 `webPushNotification.js` 사용:

```javascript
import { requestNotificationWithToken } from '../utils/webPushNotification'

// 알림 활성화
const result = await requestNotificationWithToken(studentId)
console.log('알림 활성화 성공:', result)
```

### 테스트

1. **브라우저에서 테스트**
   - 홈 페이지 접속
   - "알림 받기" 버튼 클릭
   - 알림 권한 허용
   - Service Worker 등록 확인

2. **관리자 페이지에서 예매 오픈**
   - 관리자 페이지 접속
   - 노선 오픈 토글
   - 자동으로 모든 사용자에게 푸시 알림 전송

3. **백그라운드 알림 테스트**
   - 브라우저 최소화 또는 다른 탭으로 이동
   - 관리자가 예매 오픈
   - 알림 수신 확인

## API 엔드포인트

### 1. VAPID 공개키 조회
```
GET /api/push/vapid-public-key
```

### 2. 푸시 구독 등록
```
POST /api/push/subscribe
{
  "student_id": "20240001",
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

### 3. 푸시 구독 해제
```
POST /api/push/unsubscribe
{
  "student_id": "20240001"
}
```

### 4. 테스트 알림 전송
```
POST /api/push/test
{
  "student_id": "20240001",
  "title": "테스트 알림",
  "body": "알림 테스트입니다"
}
```

## 플랫폼별 지원

| 플랫폼 | Service Worker | Push API | 백그라운드 알림 |
|--------|----------------|----------|----------------|
| **Chrome (PC)** | ✅ | ✅ | ✅ |
| **Edge (PC)** | ✅ | ✅ | ✅ |
| **Firefox (PC)** | ✅ | ✅ | ✅ |
| **Chrome (Android)** | ✅ | ✅ | ✅ |
| **Samsung Internet** | ✅ | ✅ | ✅ |
| **Safari (iOS)** | ⚠️ | ⚠️ | ❌ |

### iOS 제한사항

- iOS 16.4+ 부터 PWA에서 Web Push 지원
- 앱이 포그라운드에 있을 때만 알림 수신
- 백그라운드 알림은 여전히 제한적
- 네이티브 앱 개발 권장

## 문제 해결

### 1. Service Worker 등록 실패

**증상**: "Service Worker를 지원하지 않습니다"

**해결**:
- HTTPS 또는 localhost에서만 작동
- ngrok 사용 시 HTTPS URL 확인
- 브라우저 호환성 확인

### 2. 푸시 구독 실패

**증상**: "푸시 알림을 지원하지 않습니다"

**해결**:
- 브라우저가 Push API 지원하는지 확인
- 알림 권한이 허용되었는지 확인
- VAPID 공개키가 올바른지 확인

### 3. 알림이 전송되지 않음

**증상**: 예매 오픈해도 알림 안 옴

**해결**:
- 백엔드 로그 확인
- `push_subscription`이 DB에 저장되었는지 확인
- `notification_enabled`가 `true`인지 확인
- VAPID 비공개키가 올바른지 확인

### 4. 백그라운드 알림 안 옴

**증상**: 브라우저 최소화하면 알림 안 옴

**해결**:
- Service Worker가 등록되었는지 확인
- 브라우저 설정에서 알림 허용 확인
- 브라우저가 백그라운드 알림 지원하는지 확인

## 디버깅

### 브라우저 콘솔

```javascript
// Service Worker 상태 확인
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('등록된 Service Workers:', registrations)
})

// 푸시 구독 상태 확인
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(subscription => {
    console.log('푸시 구독:', subscription)
  })
})
```

### 백엔드 로그

```bash
# 백엔드 터미널에서 확인
# 예매 오픈 시 다음 로그가 표시되어야 함:
INFO: 예매 오픈 감지 - 푸시 알림 전송 시작
INFO: 3명의 사용자에게 푸시 알림 전송 시도
INFO: 멀티캐스트 완료: 성공 3, 실패 0
INFO: 푸시 알림 전송 결과: {'success_count': 3, 'failure_count': 0}
```

## 보안

1. **VAPID 비공개키 보호**
   - `.env` 파일을 `.gitignore`에 추가
   - 환경 변수로만 관리
   - 절대 공개 저장소에 커밋하지 않기

2. **구독 정보 보호**
   - HTTPS 사용
   - 인증된 사용자만 구독 가능
   - 만료된 구독 자동 정리

## 다음 단계

1. ✅ VAPID 키 생성 및 설정
2. ✅ 백엔드/프론트엔드 재시작
3. ✅ 알림 테스트
4. ⬜ 프로덕션 배포
5. ⬜ 모니터링 설정

## 참고 자료

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Can I Use: Push API](https://caniuse.com/push-api)
