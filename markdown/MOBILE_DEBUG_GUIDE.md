# 모바일 디버깅 가이드

## 문제: 모바일에서 예매 상태가 업데이트되지 않음

### 원인
모바일 기기는 `localhost:8000`에 접근할 수 없습니다. PC의 localhost는 PC 자신만 접근 가능하기 때문입니다.

### 해결 방법

#### 옵션 1: ngrok 사용 (추천)

1. **ngrok 설치 및 실행**
   ```bash
   # 백엔드 서버가 실행 중인 상태에서
   ngrok http 8000
   ```

2. **ngrok URL 복사**
   - 터미널에 표시되는 `https://xxxx.ngrok-free.app` 형식의 URL 복사
   - 예: `https://778ee6360c4d.ngrok-free.app`

3. **프론트엔드 .env 파일 업데이트**
   ```bash
   # frontend/.env
   VITE_API_URL=https://your-ngrok-url.ngrok-free.app
   ```

4. **프론트엔드 재시작**
   ```bash
   cd frontend
   npm run dev
   ```

5. **모바일에서 접속**
   - 모바일 브라우저에서 프론트엔드 URL 접속
   - Vite 개발 서버 URL: `http://your-pc-ip:5173`

#### 옵션 2: PC의 로컬 IP 사용

1. **PC의 IP 주소 확인**
   ```bash
   # Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. **백엔드를 모든 인터페이스에서 접근 가능하도록 실행**
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **프론트엔드 .env 파일 업데이트**
   ```bash
   # frontend/.env
   VITE_API_URL=http://192.168.x.x:8000
   ```
   (192.168.x.x를 실제 PC IP로 변경)

4. **프론트엔드를 모든 인터페이스에서 접근 가능하도록 실행**
   ```bash
   cd frontend
   npm run dev -- --host
   ```

5. **모바일에서 접속**
   - 모바일 브라우저에서 `http://192.168.x.x:5173` 접속

## 디버깅 방법

### 1. 브라우저 콘솔 확인

모바일 브라우저에서 콘솔 로그를 확인하려면:

**iOS Safari:**
1. Mac에서 Safari > 환경설정 > 고급 > "메뉴 막대에서 개발자용 메뉴 보기" 체크
2. iPhone을 USB로 연결
3. Safari > 개발 > [iPhone 이름] > [웹페이지] 선택

**Android Chrome:**
1. PC Chrome에서 `chrome://inspect` 접속
2. Android 기기를 USB로 연결
3. USB 디버깅 허용
4. 기기 목록에서 웹페이지 선택

### 2. 콘솔 로그 확인 사항

페이지 로드 시 다음 로그가 표시되어야 합니다:
```
🌐 사용 중인 API URL: https://xxxx.ngrok-free.app
📱 디바이스 타입: ios 또는 android
```

폴링 시작 후:
```
📡 API 요청: https://xxxx.ngrok-free.app/api/reservation/status
✅ 예매 상태 체크 응답: {is_open: true/false, updated_at: ...}
🔄 상태 업데이트: 예매 오픈 또는 예매 마감
```

### 3. 네트워크 오류 확인

만약 다음과 같은 오류가 발생하면:
- `ERR_CONNECTION_REFUSED`: 백엔드 서버가 실행 중이 아니거나 URL이 잘못됨
- `ERR_NAME_NOT_RESOLVED`: ngrok URL이 만료되었거나 잘못됨
- `CORS error`: 백엔드 CORS 설정 문제 (현재는 문제 없음)

## 현재 설정 확인

```bash
# 프론트엔드 .env 파일 확인
cat frontend/.env

# 백엔드 실행 확인
curl http://localhost:8000/health

# ngrok URL 확인 (ngrok 실행 중인 경우)
curl https://your-ngrok-url.ngrok-free.app/health
```

## 문제 해결 체크리스트

- [ ] 백엔드 서버가 실행 중인가?
- [ ] ngrok이 실행 중인가? (ngrok 사용 시)
- [ ] `.env` 파일의 `VITE_API_URL`이 올바른가?
- [ ] 프론트엔드를 재시작했는가?
- [ ] 모바일과 PC가 같은 Wi-Fi에 연결되어 있는가? (로컬 IP 사용 시)
- [ ] 모바일 브라우저 콘솔에서 API URL이 올바르게 표시되는가?
- [ ] 모바일 브라우저에서 API 요청이 성공하는가?

## 추가 팁

### ngrok URL 만료 방지
- 무료 ngrok은 세션이 종료되면 URL이 변경됩니다
- ngrok 계정 생성 후 authtoken 설정하면 더 안정적입니다
- 또는 유료 플랜 사용 시 고정 URL 사용 가능

### 개발 중 빠른 테스트
PC와 모바일이 같은 네트워크에 있다면 로컬 IP 방식이 더 빠릅니다.
