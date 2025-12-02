# Web Push 알림 설정 체크리스트 ✅

## 문제 상황
- "유효한 push subscription이 없습니다" 에러
- 알림 활성화해도 데이터베이스에 값이 안 들어감
- 백그라운드 알림이 안 옴

## 원인
1. VAPID 키가 백엔드 .env에 설정되지 않음
2. Supabase 데이터베이스에 `push_subscription` 컬럼이 없음
3. 프론트엔드가 새로운 Web Push 방식을 사용하도록 업데이트 필요

## 해결 단계

### 1단계: VAPID 키 생성 ⬜

```bash
cd backend
source venv/bin/activate
python generate_vapid_keys.py
```

**출력 예시:**
```
PUBLIC: BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI
PRIVATE_START
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2mmhlUF8sf7nu43O
PqMnlnLU8Xs+Re4pZNHprvXTvnChRANCAARXJNdc12xDjXo51kQOXPhN5LVPKOdn
v7cXZnmg0VUwM8EBEEshyz0wSYgiIJbuA4ahbv/lhqZ/gWjUzrwuMTiS
-----END PRIVATE KEY-----
PRIVATE_END
```

**이 값들을 복사해두세요!**

### 2단계: 백엔드 .env 파일 수정 ⬜

`backend/.env` 파일을 열고 다음 내용 추가:

```bash
# 기존 설정은 그대로 두고 아래 내용 추가

# VAPID 키 (Web Push 알림용)
VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI
VAPID_PRIVATE_KEY_PEM='-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2mmhlUF8sf7nu43O
PqMnlnLU8Xs+Re4pZNHprvXTvnChRANCAARXJNdc12xDjXo51kQOXPhN5LVPKOdn
v7cXZnmg0VUwM8EBEEshyz0wSYgiIJbuA4ahbv/lhqZ/gWjUzrwuMTiS
-----END PRIVATE KEY-----'
```

⚠️ **주의**: 
- 공개키는 한 줄로 입력
- 비공개키는 작은따옴표로 감싸고 여러 줄 그대로 입력
- 1단계에서 생성한 실제 키 값을 사용하세요!

### 3단계: 프론트엔드 .env 파일 확인 ✅

`frontend/.env` 파일에 공개키가 있는지 확인:

```bash
VITE_VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQSyHLPTBJiCIglu4DhqFu_-WGpn-BaNTOvC4xOJI
```

✅ 이미 추가되어 있습니다!

### 4단계: Supabase 데이터베이스 스키마 업데이트 ⬜

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "SQL Editor" 클릭
4. 다음 SQL 실행:

```sql
-- users 테이블에 push_subscription 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_subscription JSONB,
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false;

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('push_subscription', 'notification_enabled');
```

**예상 결과:**
```
column_name          | data_type
---------------------|----------
push_subscription    | jsonb
notification_enabled | boolean
```

### 5단계: 백엔드 설정 확인 ⬜

```bash
cd backend
source venv/bin/activate
python check_vapid_setup.py
```

**예상 출력:**
```
================================================================================
VAPID 설정 확인
================================================================================
✅ VAPID_PUBLIC_KEY: BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQS...
✅ VAPID_PRIVATE_KEY_PEM: 설정됨 (245 문자)
   형식: PEM ✓
================================================================================
✅ Supabase 설정: OK
================================================================================

🎉 모든 설정이 완료되었습니다!
```

### 6단계: 백엔드 재시작 ⬜

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**확인 사항:**
- 에러 없이 시작되는지 확인
- `INFO: Application startup complete` 메시지 확인

### 7단계: 프론트엔드 재시작 ⬜

```bash
cd frontend
npm run dev
```

**확인 사항:**
- 포트 확인 (5173 또는 5174)
- 빌드 에러 없는지 확인

### 8단계: 테스트 ⬜

#### 8.1 브라우저에서 테스트

1. **홈 페이지 접속**
   ```
   http://localhost:5174
   ```

2. **로그인**
   - 학번과 비밀번호로 로그인

3. **알림 활성화**
   - "알림 받기" 버튼 클릭
   - 알림 권한 허용 클릭
   - 성공 메시지 확인

4. **브라우저 콘솔 확인** (F12)
   ```
   🔔 알림 활성화 시작: {studentId: "20240001", deviceType: "web"}
   ✅ Service Worker 등록 성공: ...
   ✅ 푸시 구독 성공: {permission: "granted", deviceType: "web", subscription: {...}}
   ```

5. **Supabase에서 확인**
   - Supabase Dashboard > Table Editor > users
   - 해당 사용자의 `push_subscription` 컬럼에 JSON 데이터 확인
   - `notification_enabled`가 `true`인지 확인

#### 8.2 백그라운드 알림 테스트

1. **브라우저 최소화 또는 다른 탭으로 이동**

2. **관리자 페이지에서 예매 오픈**
   ```
   http://localhost:5174/admin
   ```
   - 노선 오픈 토글

3. **백엔드 로그 확인**
   ```
   INFO: 예매 오픈 감지 - 푸시 알림 전송 시작
   INFO: 1명의 사용자에게 푸시 알림 전송 시도
   INFO: 푸시 알림 전송 성공: ...
   INFO: 멀티캐스트 완료: 성공 1, 실패 0
   ```

4. **알림 수신 확인**
   - 브라우저 알림이 표시되는지 확인
   - 제목: "🎉 통학버스 예매 오픈!"
   - 내용: "통학버스 예매가 오픈되었습니다. 지금 바로 예매하세요!"

## 문제 해결

### "유효한 push subscription이 없습니다"

**원인:** 
- Supabase에 구독 정보가 저장되지 않음

**해결:**
1. 4단계 (Supabase 스키마 업데이트) 완료 확인
2. 알림 활성화 다시 시도
3. 브라우저 콘솔에서 에러 확인

### "VAPID 공개키가 설정되지 않았습니다"

**원인:**
- 백엔드 .env에 VAPID 키가 없음

**해결:**
1. 1단계 (VAPID 키 생성) 실행
2. 2단계 (백엔드 .env 수정) 완료
3. 5단계 (설정 확인) 실행
4. 백엔드 재시작

### "Service Worker 등록 실패"

**원인:**
- HTTPS 또는 localhost가 아님
- 브라우저가 Service Worker 미지원

**해결:**
- localhost 또는 ngrok HTTPS URL 사용
- Chrome, Edge, Firefox 사용

### 알림이 전송되지 않음

**원인:**
- VAPID 비공개키 오류
- 구독 정보가 DB에 없음

**해결:**
1. 백엔드 로그 확인
2. Supabase에서 `push_subscription` 확인
3. VAPID 키 재생성 후 다시 설정

## 완료 체크리스트

- [ ] 1단계: VAPID 키 생성
- [ ] 2단계: 백엔드 .env 수정
- [x] 3단계: 프론트엔드 .env 확인
- [ ] 4단계: Supabase 스키마 업데이트
- [ ] 5단계: 백엔드 설정 확인
- [ ] 6단계: 백엔드 재시작
- [ ] 7단계: 프론트엔드 재시작
- [ ] 8단계: 테스트

## 도움이 필요하면

1. 백엔드 로그 확인
2. 브라우저 콘솔 확인
3. Supabase 데이터 확인
4. `WEB_PUSH_SETUP.md` 참고

모든 단계를 완료하면 백그라운드 푸시 알림이 정상 작동합니다! 🎉
