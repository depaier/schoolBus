# iOS PWA 알림 설정 가이드

## 🚨 핵심 문제

**iOS는 HTTP에서 PWA 기능(Service Worker, Push Notification)을 지원하지 않습니다!**

현재 `http://192.168.207.207:5173`으로 접속하고 있어서 알림이 작동하지 않습니다.

## ✅ 해결 방법

### 1단계: ngrok으로 HTTPS 터널 생성

기존 ngrok 프로세스를 종료하고 새로 시작:

```bash
# 기존 ngrok 종료
pkill ngrok

# 프론트엔드와 백엔드 동시 터널링
cd /Users/jinho/개발/schoolBus
ngrok start --all
```

이렇게 하면 두 개의 HTTPS URL이 생성됩니다:
- 프론트엔드: `https://xxxxx.ngrok-free.app` (5173 포트)
- 백엔드: `https://yyyyy.ngrok-free.app` (8000 포트)

### 2단계: 프론트엔드 환경변수 설정

`.env` 파일에 백엔드 ngrok URL 설정:

```bash
cd /Users/jinho/개발/schoolBus/frontend
echo "VITE_API_URL=https://[백엔드-ngrok-url]" > .env
```

### 3단계: 서버 재시작

```bash
# 프론트엔드 (이미 실행 중이면 재시작)
npm run dev -- --host
```

### 4단계: 아이폰에서 테스트

1. **Safari로 프론트엔드 ngrok URL 접속**
   - 예: `https://xxxxx.ngrok-free.app`
   
2. **홈 화면에 추가**
   - Safari 하단 공유 버튼(□↑) 탭
   - "홈 화면에 추가" 선택
   - "추가" 버튼 클릭

3. **홈 화면의 앱 아이콘으로 실행**
   - Safari가 아닌 독립 앱으로 실행됨
   - 상단 주소창이 없어야 정상

4. **로그인 후 알림 받기**
   - 로그인
   - "알림 받기" 버튼 클릭
   - "허용" 선택

## ⚠️ iOS 제한사항

**중요:** iOS PWA는 다음과 같은 제한이 있습니다:

1. **포그라운드 알림만 가능**
   - 앱이 실행 중일 때만 알림 표시
   - 백그라운드 푸시 알림 미지원

2. **홈 화면 추가 필수**
   - Safari 브라우저에서는 알림 불가능
   - 반드시 홈 화면에 추가된 앱으로 실행

3. **앱 검색에 안 나옴**
   - iOS 앱 검색은 App Store 앱만 표시
   - PWA는 홈 화면에서만 확인 가능

## 🔍 문제 해결

### "알림 권한이 거부되었습니다" 오류

1. **HTTP로 접속한 경우**
   - ngrok HTTPS URL 사용 필수

2. **Safari 브라우저에서 접속한 경우**
   - 홈 화면에 추가 후 앱 아이콘으로 실행

3. **권한을 이미 거부한 경우**
   - 설정 > Safari > 고급 > 웹사이트 데이터에서 사이트 삭제
   - 홈 화면에서 앱 삭제
   - 다시 홈 화면에 추가

### 앱이 홈 화면에 제대로 추가되었는지 확인

콘솔에서 확인:
```javascript
console.log('Standalone:', window.navigator.standalone);
// true면 홈 화면 앱, false면 Safari
```

## 📱 안드로이드는?

안드로이드는 HTTP에서도 PWA가 작동하지만, HTTPS 권장:
- Chrome에서 "홈 화면에 추가"
- 백그라운드 푸시 알림 지원
- 앱 서랍에 표시됨

## 🎯 권장사항

**프로덕션 배포 시:**
1. 실제 도메인 + HTTPS 인증서 사용
2. Firebase Cloud Messaging (FCM) 설정
3. iOS는 제한사항 명시하고 안드로이드 위주로 안내
