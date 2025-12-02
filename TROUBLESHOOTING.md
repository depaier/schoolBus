# 문제 해결 가이드

## 현재 발생한 문제

1. ❌ 관리자 페이지에서 노선 데이터 로드 실패
2. ❌ 모니터링이 작동하지 않음

## 즉시 확인할 사항

### 1. 디버그 페이지 접속

브라우저에서 다음 URL로 접속:
```
http://localhost:5173/debug
```

이 페이지에서 다음을 확인:
- ✅ API_BASE_URL이 올바른지
- ✅ 모든 API 호출이 성공하는지
- ✅ 에러 메시지 확인

### 2. 프론트엔드 재시작 (필수!)

환경 변수(`.env` 파일) 변경 후에는 **반드시** 프론트엔드를 재시작해야 합니다:

```bash
# 현재 실행 중인 프론트엔드 중지 (Ctrl+C)
# 그 다음 다시 시작
cd frontend
npm run dev
```

### 3. 브라우저 캐시 삭제

브라우저에서:
- **Chrome/Edge**: `Cmd+Shift+R` (Mac) 또는 `Ctrl+Shift+R` (Windows)
- **Safari**: `Cmd+Option+R`

또는 개발자 도구 > Network 탭 > "Disable cache" 체크

### 4. 백엔드 서버 확인

```bash
# 백엔드가 실행 중인지 확인
curl http://localhost:8000/health

# 예상 결과: {"status":"healthy"}
```

### 5. ngrok 확인 (모바일 테스트 시)

```bash
# ngrok이 실행 중인지 확인
curl https://778ee6360c4d.ngrok-free.app/health

# 예상 결과: {"status":"healthy"}
```

만약 에러가 발생하면 ngrok을 다시 시작:
```bash
ngrok http 8000
```

새로운 URL을 `frontend/.env` 파일에 업데이트:
```
VITE_API_URL=https://새로운-url.ngrok-free.app
```

## 일반적인 문제와 해결 방법

### 문제 1: "노선 데이터를 불러오는데 실패했습니다"

**원인:**
- 백엔드 서버가 실행 중이 아님
- 환경 변수가 잘못 설정됨
- 프론트엔드가 환경 변수 변경을 인식하지 못함

**해결:**
1. 백엔드 서버 실행 확인
2. `.env` 파일 확인
3. 프론트엔드 재시작
4. 브라우저 캐시 삭제

### 문제 2: "예매 상태가 업데이트되지 않음"

**원인:**
- 폴링이 시작되지 않음
- API URL이 잘못됨
- 백엔드에서 상태가 업데이트되지 않음

**해결:**
1. "실시간 모니터링 시작" 버튼 클릭 확인
2. 브라우저 콘솔에서 로그 확인:
   ```
   📡 API 요청: ...
   ✅ 예매 상태 체크 응답: ...
   ```
3. 관리자 페이지에서 노선 오픈 확인

### 문제 3: "모바일에서 작동하지 않음"

**원인:**
- 모바일은 localhost에 접근할 수 없음
- ngrok URL이 만료됨

**해결:**
1. ngrok 실행 확인
2. `.env` 파일에 ngrok URL 설정
3. 프론트엔드 재시작
4. 모바일에서 ngrok URL로 접속

## 체크리스트

프론트엔드 문제 해결:
- [ ] `.env` 파일에 올바른 API URL 설정
- [ ] 프론트엔드 재시작 (`npm run dev`)
- [ ] 브라우저 캐시 삭제 (Hard Refresh)
- [ ] `/debug` 페이지에서 API 테스트
- [ ] 브라우저 콘솔에서 에러 확인

백엔드 문제 해결:
- [ ] 백엔드 서버 실행 중 (`uvicorn main:app --reload`)
- [ ] `http://localhost:8000/health` 접속 확인
- [ ] Supabase 연결 확인

모바일 문제 해결:
- [ ] ngrok 실행 중
- [ ] ngrok URL이 `.env`에 설정됨
- [ ] 모바일과 PC가 같은 Wi-Fi 연결 (로컬 IP 사용 시)

## 디버깅 명령어

```bash
# 백엔드 서버 상태 확인
curl http://localhost:8000/health

# ngrok URL 확인
curl https://your-ngrok-url.ngrok-free.app/health

# 노선 API 테스트
curl http://localhost:8000/api/routes

# 예매 상태 API 테스트
curl http://localhost:8000/api/reservation/status

# 실행 중인 포트 확인
lsof -ti:8000  # 백엔드
lsof -ti:5173  # 프론트엔드
```

## 로그 확인 방법

### 브라우저 콘솔
1. 개발자 도구 열기 (F12 또는 Cmd+Option+I)
2. Console 탭 선택
3. 다음 로그 확인:
   - `🌐 사용 중인 API URL: ...`
   - `📡 API 요청: ...`
   - `✅ 예매 상태 체크 응답: ...`

### 백엔드 로그
터미널에서 백엔드 서버 로그 확인:
- API 요청 로그
- 에러 메시지
- Supabase 연결 상태

## 여전히 문제가 해결되지 않으면

1. `/debug` 페이지 스크린샷
2. 브라우저 콘솔 로그 복사
3. 백엔드 터미널 로그 복사
4. `.env` 파일 내용 확인 (민감한 정보 제외)
