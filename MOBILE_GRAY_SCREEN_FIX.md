# 모바일 회색 화면 문제 해결 가이드

## 문제 상황
- ✅ PC에서는 정상 작동
- ❌ 모바일에서 회색 화면만 표시
- ❌ 콘텐츠가 로드되지 않음

## 원인 분석

### 1. Service Worker 캐싱 문제 ⚠️
```
Service Worker registered successfully: https://92044b218e7f.ngrok-free.app/
```
- Service Worker가 이전 버전의 파일을 캐싱
- 모바일에서 오래된 캐시 사용
- 새로운 코드가 반영되지 않음

### 2. Axios User-Agent 헤더 오류 ❌
```
Refused to set unsafe header "User-Agent"
```
- 브라우저에서 `User-Agent` 헤더 설정 금지
- 보안상 제한된 헤더
- 모바일 브라우저에서 더 엄격하게 적용

### 3. 아이콘 파일 누락 ⚠️
```
Error while trying to use the following icon from the Manifest:
https://92044b218e7f.ngrok-free.app/icon-192.png (Download error or resource isn't a valid image)
```
- `icon-192.png` 파일이 없음
- Service Worker에서 아이콘 로드 실패

## 해결 방법

### ✅ 1단계: 코드 수정 완료

다음 파일들이 자동으로 수정되었습니다:

#### `frontend/src/utils/axiosConfig.js`
```javascript
// User-Agent 헤더 제거 (브라우저에서 설정 불가)
// axios.defaults.headers.common['User-Agent'] = 'SchoolBusApp'
```

#### `frontend/public/sw.js`
```javascript
// 캐시 버전 업데이트
const CACHE_NAME = 'schoolbus-v2';

// 개발 중에는 캐싱 비활성화
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// 아이콘 경로 수정
icon: '/vite.svg',
badge: '/vite.svg',
```

### ✅ 2단계: 모바일에서 캐시 초기화

#### 방법 1: 캐시 초기화 페이지 사용 (권장)

모바일 브라우저에서 접속:
```
https://778ee6360c4d.ngrok-free.app/clear-cache.html
```

1. "초기화 후 새로고침" 버튼 클릭
2. 3초 후 자동으로 홈으로 이동
3. 정상 작동 확인

#### 방법 2: 브라우저 설정에서 직접 삭제

**Chrome (Android)**
1. 설정 → 개인정보 보호 및 보안
2. 인터넷 사용 기록 삭제
3. "캐시된 이미지 및 파일" 선택
4. 삭제

**Safari (iOS)**
1. 설정 → Safari
2. 고급 → 웹사이트 데이터
3. 해당 사이트 찾아서 삭제

#### 방법 3: 개발자 도구 사용 (Chrome Android)

1. Chrome에서 `chrome://inspect` 접속 (PC)
2. 모바일 디바이스 연결
3. Application → Service Workers
4. Unregister 클릭
5. Application → Cache Storage
6. 모든 캐시 삭제

### ✅ 3단계: 프론트엔드 재시작

```bash
cd frontend
npm run dev
```

### ✅ 4단계: 모바일에서 테스트

1. **모바일 브라우저에서 ngrok URL 접속**
   ```
   https://778ee6360c4d.ngrok-free.app
   ```

2. **강제 새로고침**
   - Chrome Android: 주소창 옆 새로고침 버튼 길게 누르기
   - Safari iOS: 주소창 새로고침 버튼

3. **정상 작동 확인**
   - 로그인 페이지 표시
   - 회색 화면 사라짐

## 예방 방법

### 1. 개발 중에는 Service Worker 캐싱 비활성화 ✅

현재 `sw.js`가 캐싱을 비활성화하도록 수정되었습니다.

### 2. 캐시 버전 관리

배포 시마다 `CACHE_NAME` 버전 업데이트:
```javascript
const CACHE_NAME = 'schoolbus-v3'; // 버전 증가
```

### 3. 모바일 테스트 시 항상 캐시 확인

개발 중에는:
- 브라우저 시크릿 모드 사용
- 또는 `/clear-cache.html` 페이지 북마크

## 디버깅

### 모바일 브라우저 콘솔 확인

**Chrome Android (PC에서 원격 디버깅)**
```bash
# PC Chrome에서
chrome://inspect

# 모바일 디바이스 선택
# Console 탭에서 로그 확인
```

**Safari iOS (Mac에서 원격 디버깅)**
```
# Mac Safari에서
개발자 메뉴 → [디바이스 이름] → [페이지]
```

### 확인할 로그

정상 작동 시:
```
✅ Service Worker registered successfully
✅ Home - 노선 API 응답: Object
✅ Home - 변환된 노선: Array(2)
```

문제 발생 시:
```
❌ Refused to set unsafe header "User-Agent"
❌ Service Worker: Cache failed
❌ Error loading icon
```

## 프로덕션 배포 시

### 1. Service Worker 캐싱 활성화

`sw.js` 수정:
```javascript
const CACHE_NAME = 'schoolbus-v1-prod';
const urlsToCache = [
  '/',
  '/index.html',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### 2. 아이콘 파일 추가

`frontend/public/` 폴더에:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

### 3. Manifest 파일 업데이트

`frontend/public/manifest.json`:
```json
{
  "name": "통학버스 예약",
  "short_name": "통학버스",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 요약

### 문제
- Service Worker 캐싱으로 모바일에서 오래된 코드 사용
- User-Agent 헤더 설정 오류
- 아이콘 파일 누락

### 해결
1. ✅ User-Agent 헤더 제거
2. ✅ Service Worker 캐싱 비활성화 (개발 중)
3. ✅ 아이콘 경로 수정 (`/vite.svg` 사용)
4. ✅ 캐시 초기화 페이지 추가 (`/clear-cache.html`)

### 다음 단계
1. 모바일에서 `/clear-cache.html` 접속
2. "초기화 후 새로고침" 클릭
3. 정상 작동 확인

모바일에서 회색 화면이 사라지고 정상적으로 앱이 표시됩니다! 🎉
