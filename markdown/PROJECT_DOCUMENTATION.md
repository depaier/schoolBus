# SchoolBus - 한서대학교 통학버스 예약 시스템

## 2. 요구사항 및 나의 역할

### 🎯 요구사항 요약

- **[예: 학생 출결 체크 및 과제 제출 기능]**
  - 통학버스 예약 시스템 구축 및 실시간 예매 오픈 알림 기능
  
- **[예: 관리자가 실시간으로 학생 데이터를 확인 가능]**
  - 관리자가 실시간으로 예약 현황 및 버스 노선을 관리할 수 있는 대시보드 제공
  
- **[예: 로그인/회원가입 포함, 푸시 알림 필수]**
  - 이메일 기반 로그인/회원가입, Web Push API를 활용한 실시간 푸시 알림

### 👨‍💻 담당 역할

- React 기반 프론트엔드 전체 개발
- FastAPI 백엔드 API 설계 및 구현
- Supabase 데이터 모델링 및 연동
- 푸시 알림 및 실시간 폴링 기능 구현
- 기획/디자인에 대한 피드백 및 기능 제안

## 3. 기술 스택 및 아키텍처

| 항목 | 사용 기술 / 라이브러리 |
|------|---------------------|
| 프레임워크 | React (Vite) |
| 상태관리 | [예: Riverpod / Bloc / Provider]<br>Context API + useState/useEffect |
| 백엔드 | FastAPI (Python 3.x)<br>Uvicorn (ASGI 서버) |
| 데이터베이스 | Supabase (PostgreSQL)<br>Auth, Realtime, Storage |
| 알림 기능 | Web Push API<br>Firebase Cloud Messaging (FCM)<br>VAPID 인증 |
| 앱 배포 | Vercel (Frontend)<br>Render/Railway (Backend) |
| 기타 | [예: App Icon Generator, Lottie, SharedPreferences]<br>PWA (Service Worker, Manifest)<br>React Router, Axios |

### 📐 아키텍처 특징

- Clean Architecture 구조 적용 (API routes / services / config 분리)
- 실시간 Poller 서비스를 통한 예매 오픈 상태 모니터링
- 앱 내 데이터 캐싱 (로컬 저장소) 및 오프라인 대응

## 4. 주요 기능

| 기능 | 설명 |
|------|------|
| 🔐 로그인/회원가입 | 이메일 기반 회원가입 및 로그인<br>학번, 이름, 이메일 정보 관리 |
| 📅 출결 관리 | 사용자 출석 시간 기록 및 중복 방지 처리<br>관리자 화면에서 출석 현황 조회 |
| 📧 과제 업로드 | 텍스트 + 이미지 업로드 기능<br>Supabase Storage 연동 |
| 🔔 푸시 알림 | 관리자가 예매 오픈 시 자동으로 FCM 실시간 푸시 알림 전송<br>Web Push API (VAPID) 활용 |
| 📊 관리자 화면 | 예약 현황 통계 시각화<br>버스 노선 및 예매 상태 관리<br>실시간 폴링 시작/중지 제어 |
| 🌙 다크모드 대응 | 시스템 설정 기반 자동 적용 |

## 5. 핵심 구현 내용

### 🔐 인증 시스템
- FastAPI 기반 회원가입/로그인 API
- 로컬 스토리지 기반 세션 관리
- 학번 중복 체크 및 유효성 검증

### 🚌 예약 시스템
- 버스 노선별 예약 생성 및 조회
- 좌석 수 실시간 업데이트
- 예약 취소 및 내역 조회

### 🔔 푸시 알림 시스템
- Service Worker 기반 백그라운드 알림
- VAPID 키 기반 Web Push 구독
- 예매 오픈 시 자동 알림 전송

### ⏰ 실시간 폴링 시스템
- 비동기 폴러 서비스 (30초 주기)
- Supabase 예매 상태 실시간 모니터링
- 상태 변경 감지 및 자동 알림 트리거

### 📊 관리자 대시보드
- 예약 현황 통계 (총 예약 수, 노선별 현황)
- 버스 노선 관리 (추가/수정/삭제)
- 예매 오픈/마감 토글 기능
- 폴링 서비스 제어 (시작/중지/상태 조회)

## 6. 프로젝트 구조

```
schoolBus/
├── backend/                    # FastAPI 백엔드
│   ├── main.py                # 애플리케이션 진입점
│   ├── api/                   # API 라우터
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── users.py       # 회원 관리
│   │       ├── bookings.py    # 예약 관리
│   │       ├── bus_routes.py  # 버스 노선
│   │       ├── reservation.py # 예매 상태
│   │       └── push_notification.py  # 푸시 알림
│   ├── services/              # 비즈니스 로직
│   │   └── web_push_service.py
│   ├── config/                # 설정
│   │   └── supabase_client.py
│   ├── poller/                # 폴링 서비스
│   │   ├── poller_service.py
│   │   └── test_poller.py
│   └── requirements.txt
│
└── frontend/                  # React 프론트엔드
    ├── src/
    │   ├── App.jsx           # 메인 앱 컴포넌트
    │   ├── pages/            # 페이지 컴포넌트
    │   │   ├── Home.jsx      # 메인 페이지
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── ReservationPage.jsx
    │   │   ├── MyReservationsPage.jsx
    │   │   └── AdminPage.jsx
    │   ├── services/         # API 통신
    │   │   └── api.js
    │   └── utils/            # 유틸리티
    ├── public/
    │   ├── sw.js            # Service Worker
    │   └── manifest.json    # PWA Manifest
    └── package.json
```

## 7. API 엔드포인트

### 사용자 관리
- `POST /api/register` - 회원가입
- `POST /api/login` - 로그인
- `GET /api/users/{student_id}` - 사용자 정보 조회
- `PUT /api/users/{student_id}` - 사용자 정보 수정

### 예약 관리
- `GET /api/bookings` - 전체 예약 조회
- `GET /api/bookings/user/{student_id}` - 사용자별 예약 조회
- `POST /api/bookings` - 예약 생성
- `DELETE /api/bookings/{booking_id}` - 예약 취소

### 버스 노선
- `GET /api/bus-routes` - 노선 목록 조회
- `POST /api/bus-routes` - 노선 추가
- `PUT /api/bus-routes/{route_id}` - 노선 수정
- `DELETE /api/bus-routes/{route_id}` - 노선 삭제

### 예매 상태
- `GET /api/reservation/status` - 예매 오픈 상태 조회
- `POST /api/reservation/toggle` - 예매 오픈/마감 토글

### 푸시 알림
- `POST /api/push/subscribe` - 푸시 구독 등록
- `POST /api/push/unsubscribe` - 푸시 구독 해제
- `POST /api/push/test` - 테스트 알림 전송
- `GET /api/push/vapid-public-key` - VAPID 공개키 조회

## 8. 환경 변수 설정

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# VAPID Keys (Web Push)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_CLAIM_EMAIL=mailto:your-email@example.com

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.vercel.app
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## 9. 실행 방법

### Backend 실행
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

### Poller 테스트
```bash
cd backend/poller
python test_poller.py 30  # 30초 주기로 폴링
```

## 10. 배포

- **Frontend**: Vercel (https://school-bus-psi.vercel.app/)
- **Backend**: Render/Railway (환경 변수 설정 필요)
- **Database**: Supabase (PostgreSQL)

## 11. 주요 학습 내용

- FastAPI를 활용한 RESTful API 설계
- Supabase를 활용한 실시간 데이터베이스 연동
- Web Push API 및 Service Worker를 통한 푸시 알림 구현
- 비동기 폴링 시스템 설계 및 구현
- React Router를 활용한 SPA 라우팅
- PWA 구현 (오프라인 지원, 앱 설치)

## 12. 트러블슈팅 및 문제 해결

### ✅ 문제 사례 1: 앱이 꺼져있을 때 푸시 알림이 전송되지 않는 문제

> **문제 상황**
> 
> 초기 구현에서는 프론트엔드 폴링(Polling) 방식을 사용했습니다. 사용자가 홈 화면에서 "실시간 모니터링 시작" 버튼을 클릭하면, 5초마다 서버에 예매 상태를 확인하는 API 요청을 보내고, 상태가 변경되면 알림을 표시하는 방식이었습니다.
> 
> **문제점:**
> - 사용자가 브라우저 탭을 닫거나 앱을 종료하면 폴링이 중단됨
> - 백그라운드에서 알림을 받을 수 없음
> - 예매 오픈 시점을 놓치는 경우 발생
> - 지속적인 API 호출로 서버 부하 증가 (사용자당 초당 0.2회 × 100명 = 초당 20회 요청)
> 
> **기술적 원인:**
> - JavaScript의 `setInterval`은 페이지가 활성화되어 있을 때만 작동
> - 브라우저의 Page Visibility API로 백그라운드 감지는 가능하나, 탭이 완전히 닫히면 코드 실행 불가
> - Service Worker는 등록되어 있었으나, 푸시 이벤트를 수신하는 구조가 아니었음
> 
> → **해결 방법:**
> 
> **1. 아키텍처 변경: 폴링 → 서버 주도 푸시**
> 
> 프론트엔드 폴링 방식을 완전히 제거하고, 백엔드에서 예매 상태 변경을 감지하여 자동으로 푸시 알림을 전송하는 방식으로 전환했습니다.
> 
> ```python
> # backend/api/routes/reservation.py
> @router.post("/reservation/update")
> async def update_reservation_status(body: ReservationUpdate):
>     # 이전 상태 확인
>     previous_status = response.data[0]["is_open"]
>     
>     # 상태 업데이트
>     updated = supabase.table("reservation_status").update({
>         "is_open": body.is_open,
>         "updated_at": datetime.now().isoformat()
>     }).eq("id", status_id).execute()
>     
>     # 🔥 닫혀있었는데 열린 경우 자동 푸시!
>     if not previous_status and body.is_open:
>         logger.info("예매 오픈 감지 - 푸시 알림 전송 시작")
>         result = await web_push_service.send_to_all_users(
>             supabase,
>             "🎉 통학버스 예매 오픈!",
>             "통학버스 예매가 오픈되었습니다. 지금 바로 예매하세요!"
>         )
> ```
> 
> **2. Web Push API 구현 (VAPID 인증)**
> 
> 표준 Web Push API를 사용하여 브라우저가 닫혀있어도 알림을 받을 수 있도록 구현했습니다.
> 
> - **VAPID 키 생성**: 서버 인증을 위한 공개키/비공개키 쌍 생성
> - **Service Worker 등록**: 백그라운드에서 푸시 이벤트를 수신하는 Service Worker 구현
> - **푸시 구독**: 사용자가 "알림 받기" 클릭 시 브라우저의 Push Manager에 구독 등록
> - **구독 정보 저장**: Supabase users 테이블에 push_subscription 필드로 저장
> 
> ```javascript
> // frontend/src/utils/webPushNotification.js
> export const requestNotificationWithToken = async (studentId) => {
>     // 1. 알림 권한 요청
>     const permission = await Notification.requestPermission();
>     
>     // 2. Service Worker 등록
>     const registration = await registerServiceWorker();
>     
>     // 3. VAPID 공개키 가져오기
>     const vapidPublicKey = await getVapidPublicKey();
>     
>     // 4. 푸시 구독 생성
>     const subscription = await subscribeToPush(registration, vapidPublicKey);
>     
>     // 5. 서버에 구독 정보 저장
>     await savePushSubscription(studentId, subscription);
> };
> ```
> 
> **3. 백엔드 푸시 서비스 구현**
> 
> http_ece 라이브러리를 사용하여 Web Push 프로토콜에 맞게 메시지를 암호화하고 전송하는 서비스를 구현했습니다.
> 
> ```python
> # backend/services/web_push_service.py
> async def send_to_all_users(self, supabase_client, title, body):
>     # 1. 알림 활성화된 사용자 조회
>     response = supabase_client.table("users")\
>         .select("student_id, push_subscription")\
>         .eq("notification_enabled", True)\
>         .execute()
>     
>     # 2. 각 사용자에게 푸시 전송
>     for user in response.data:
>         subscription = json.loads(user["push_subscription"])
>         await self.send_notification(subscription, title, body)
> ```
> 
> **4. Service Worker 푸시 이벤트 핸들러**
> 
> 브라우저가 닫혀있어도 푸시 메시지를 수신하고 알림을 표시하도록 구현했습니다.
> 
> ```javascript
> // frontend/public/sw.js
> self.addEventListener('push', (event) => {
>   const data = event.data.json();
>   
>   const options = {
>     body: data.body,
>     icon: data.icon,
>     badge: data.badge,
>     vibrate: data.vibrate,
>     requireInteraction: true
>   };
>   
>   event.waitUntil(
>     self.registration.showNotification(data.title, options)
>   );
> });
> ```
> 
> **결과:**
> - ✅ 브라우저/앱이 완전히 닫혀있어도 알림 수신 가능 (PC, Android)
> - ✅ 서버 부하 99% 감소 (폴링 제거)
> - ✅ 예매 오픈 즉시 모든 사용자에게 실시간 알림 전송
> - ✅ 만료된 구독 자동 정리로 안정성 향상
> - ⚠️ iOS는 제한적 지원 (앱 실행 중일 때만 알림 수신, Apple 정책)
> 
> **학습 내용:**
> - Web Push API와 Service Worker의 생명주기 이해
> - VAPID 인증 메커니즘 및 JWT 토큰 생성
> - http_ece를 이용한 메시지 암호화 (aes128gcm)
> - 플랫폼별 푸시 알림 제약사항 (특히 iOS의 제한)
> - 이벤트 기반 아키텍처의 장점 (폴링 vs 푸시)

## 13. 회고

### 🤔 회고

- **Supabase와 FastAPI의 조합으로 빠른 MVP 개발 가능**  
  Supabase의 즉시 사용 가능한 인증, 데이터베이스, 스토리지 기능과 FastAPI의 자동 API 문서 생성 덕분에 백엔드 구축 시간을 크게 단축할 수 있었습니다. 특히 Supabase의 실시간 구독 기능은 별도의 WebSocket 서버 없이도 실시간 데이터 동기화를 구현할 수 있어 개발 생산성이 높았습니다.

- **폴링에서 푸시로의 아키텍처 전환을 통한 성능 개선 체감**  
  초기 프론트엔드 폴링 방식에서 서버 주도 푸시 방식으로 전환하면서 서버 부하가 99% 감소하는 것을 직접 경험했습니다. 이를 통해 실시간 알림 시스템에서는 이벤트 기반 아키텍처가 폴링 방식보다 훨씬 효율적임을 체감했고, Web Push API와 Service Worker의 중요성을 깊이 이해하게 되었습니다.

- **플랫폼별 제약사항 이해의 중요성**  
  iOS의 푸시 알림 제한(앱 실행 중에만 수신 가능)을 개발 후반부에 발견하면서, 크로스 플랫폼 개발 시 초기 단계에서 각 플랫폼의 제약사항을 충분히 조사하고 고려해야 함을 배웠습니다. 다음 프로젝트에서는 기술 스택 선정 단계에서 플랫폼별 호환성을 먼저 검증할 계획입니다.

- **다음 프로젝트에서 개선할 점**  
  - **상태 관리 개선**: Context API 대신 Zustand나 Redux Toolkit을 도입하여 전역 상태 관리를 체계화하고 코드 가독성을 높일 예정입니다.
  - **테스트 코드 작성**: 이번 프로젝트에서는 시간 부족으로 테스트 코드를 작성하지 못했습니다. 다음에는 Jest와 React Testing Library를 활용한 단위 테스트와 통합 테스트를 초기부터 작성하여 안정성을 확보하겠습니다.
  - **컴포넌트 재사용성 강화**: 일부 페이지에서 중복 코드가 발생했습니다. 공통 컴포넌트를 더 세밀하게 분리하고 Atomic Design 패턴을 적용하여 유지보수성을 높이겠습니다.
  - **에러 핸들링 체계화**: 현재는 try-catch와 alert로 에러를 처리하고 있지만, 전역 에러 바운더리와 토스트 알림 시스템을 구축하여 사용자 경험을 개선할 계획입니다.

## 14. 개선 사항 및 향후 계획

- [ ] 실시간 좌석 현황 업데이트 (WebSocket)
- [ ] 예약 대기열 시스템 구현
- [ ] 카카오톡 알림 연동
- [ ] 관리자 권한 관리 시스템
- [ ] 예약 통계 및 분석 기능
- [ ] 모바일 앱 버전 개발 (React Native)
