# 푸시 토큰 테스트 가이드

## 🧪 빠른 테스트

### 1. 회원가입 (선행 작업)
```bash
# 회원가입 페이지 접속
http://localhost:5173/register

# 테스트 계정 생성
학번: 20240001
이름: 홍길동
연락처: 010-1234-5678
이메일: hong@test.com
```

### 2. 홈 페이지에서 알림 설정
```bash
# 홈 페이지 접속
http://localhost:5173/

# "알림 받기" 버튼 클릭
# 학번 입력: 20240001
# 브라우저 알림 권한 허용
```

### 3. 결과 확인

#### 브라우저 알림
- "✅ 알림 설정 완료!" 알림 표시
- 디바이스 타입과 토큰 정보 alert 표시

#### 콘솔 로그
```
디바이스 타입: android (또는 ios, web)
FCM 토큰 생성 (임시): fcm_1234567890_abc123
푸시 토큰 저장 성공: { message: "푸시 토큰이 업데이트되었습니다.", ... }
```

#### Supabase 확인
```sql
SELECT student_id, name, fcm_token, apn_token 
FROM users 
WHERE student_id = '20240001';
```

## 📱 디바이스별 테스트

### Android (Chrome)
```
User Agent: Mozilla/5.0 (Linux; Android 10; ...) Chrome/...
디바이스 타입: android
토큰 타입: FCM
저장 컬럼: fcm_token
```

### iOS (Safari)
```
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 ...) Safari/...
디바이스 타입: ios
토큰 타입: APN
저장 컬럼: apn_token
```

### Desktop (Chrome/Firefox)
```
User Agent: Mozilla/5.0 (Windows NT 10.0; ...) Chrome/...
디바이스 타입: web
토큰 타입: FCM
저장 컬럼: fcm_token
```

## 🔧 cURL 테스트

### FCM 토큰 저장
```bash
curl -X POST http://localhost:8000/api/users/20240001/token \
  -H "Content-Type: application/json" \
  -d '{
    "fcm_token": "fcm_test_1234567890_android"
  }'
```

### APN 토큰 저장
```bash
curl -X POST http://localhost:8000/api/users/20240001/token \
  -H "Content-Type: application/json" \
  -d '{
    "apn_token": "apn_test_1234567890_iphone"
  }'
```

### 사용자 정보 조회
```bash
curl http://localhost:8000/api/users/20240001
```

## 🎯 예상 결과

### 성공 시
```json
{
  "message": "푸시 토큰이 업데이트되었습니다.",
  "student_id": "20240001",
  "token_type": "fcm"
}
```

### 실패 시 (회원 없음)
```json
{
  "detail": "회원을 찾을 수 없습니다."
}
```

### 실패 시 (토큰 없음)
```json
{
  "detail": "토큰 정보가 없습니다."
}
```

## 📊 Supabase 데이터 확인

### SQL Editor에서 실행
```sql
-- 1. 모든 토큰 확인
SELECT 
    student_id,
    name,
    CASE 
        WHEN fcm_token IS NOT NULL THEN 'FCM'
        WHEN apn_token IS NOT NULL THEN 'APN'
        ELSE 'None'
    END as token_type,
    COALESCE(fcm_token, apn_token, 'No Token') as token,
    notification_enabled,
    created_at
FROM users
ORDER BY created_at DESC;

-- 2. FCM 토큰만 확인
SELECT student_id, name, fcm_token 
FROM users 
WHERE fcm_token IS NOT NULL;

-- 3. APN 토큰만 확인
SELECT student_id, name, apn_token 
FROM users 
WHERE apn_token IS NOT NULL;

-- 4. 알림 활성화된 사용자
SELECT student_id, name, fcm_token, apn_token 
FROM users 
WHERE notification_enabled = true 
  AND (fcm_token IS NOT NULL OR apn_token IS NOT NULL);
```

## 🐛 트러블슈팅

### 문제 1: "회원을 찾을 수 없습니다"
**원인**: 학번이 등록되지 않음
**해결**: 
1. `/register` 페이지에서 회원가입
2. 또는 다른 학번으로 시도

### 문제 2: 알림 권한 거부
**원인**: 브라우저 알림 권한 차단
**해결**:
1. 브라우저 주소창 왼쪽 자물쇠 아이콘 클릭
2. 알림 권한 "허용"으로 변경
3. 페이지 새로고침

### 문제 3: 토큰이 저장되지 않음
**원인**: 백엔드 서버 미실행 또는 Supabase 연결 오류
**해결**:
1. 백엔드 서버 실행 확인: `http://localhost:8000/docs`
2. `.env` 파일의 Supabase 설정 확인
3. 네트워크 탭에서 API 응답 확인

### 문제 4: 디바이스 타입이 잘못 감지됨
**원인**: User Agent 문자열 파싱 오류
**해결**:
1. 콘솔에서 `navigator.userAgent` 확인
2. `pushNotification.js`의 `getDeviceType()` 로직 수정

## 📝 체크리스트

### 사전 준비
- [ ] 백엔드 서버 실행 중 (`uvicorn main:app --reload`)
- [ ] 프론트엔드 서버 실행 중 (`npm run dev`)
- [ ] Supabase 연결 정상
- [ ] `.env` 파일 설정 완료

### 회원가입
- [ ] 회원가입 페이지 접속
- [ ] 테스트 계정 생성
- [ ] Supabase에서 회원 정보 확인

### 알림 설정
- [ ] 홈 페이지 접속
- [ ] "알림 받기" 버튼 클릭
- [ ] 학번 입력
- [ ] 브라우저 알림 권한 허용
- [ ] 테스트 알림 수신

### 토큰 확인
- [ ] 브라우저 콘솔에서 토큰 정보 확인
- [ ] Supabase에서 토큰 저장 확인
- [ ] API 응답 확인

## 🎉 성공 기준

### ✅ 모든 항목 확인
1. 브라우저 알림 권한 허용됨
2. 디바이스 타입 정확히 감지됨
3. 토큰 생성됨 (fcm_* 또는 apn_*)
4. API 호출 성공 (200 OK)
5. Supabase에 토큰 저장됨
6. 테스트 알림 수신됨

### 📊 Supabase 데이터 예시
```
student_id | name   | fcm_token                    | apn_token | notification_enabled
-----------|--------|------------------------------|-----------|---------------------
20240001   | 홍길동 | fcm_1700000000000_abc123     | NULL      | true
20240002   | 김철수 | NULL                         | apn_1700000000000_xyz789 | true
20240003   | 이영희 | fcm_1700000000000_def456     | NULL      | true
```

## 🚀 다음 단계

### 1. 실제 Firebase 설정
- Firebase 프로젝트 생성
- `firebase-config.js` 설정
- `pushNotification.js`에서 Firebase SDK 사용

### 2. 서버에서 푸시 알림 전송
- FCM Admin SDK 설치
- 예매 오픈 시 모든 토큰에 푸시 전송
- 전송 결과 로깅

### 3. 토큰 관리
- 만료된 토큰 자동 갱신
- 토큰 유효성 검증
- 중복 토큰 제거

### 4. 로그인 시스템
- 학번 인증 자동화
- 세션 관리
- 토큰 자동 등록
