# 회원가입 기능 가이드

## ✅ 구현 완료 사항

### 1. 백엔드 API (FastAPI)
- **엔드포인트**: `POST /api/users/register`
- **위치**: `/backend/api/routes/users.py`
- **기능**: 
  - 학번 중복 체크
  - 회원 정보를 Supabase `users` 테이블에 저장
  - 학번, 이름, 이메일, 전화번호 저장

### 2. 데이터베이스 (Supabase)
- **테이블**: `users`
- **필드**:
  - `id` (UUID, Primary Key)
  - `student_id` (학번, UNIQUE)
  - `name` (이름)
  - `email` (이메일, 선택)
  - `phone` (전화번호)
  - `fcm_token` (FCM 토큰)
  - `apn_token` (APN 토큰)
  - `notification_enabled` (알림 활성화)
  - `created_at`, `updated_at`

### 3. 프론트엔드 (React)
- **페이지**: `/register`
- **파일**: `/frontend/src/pages/RegisterPage.jsx`
- **기능**:
  - 학번/교번 입력
  - 비밀번호 입력 (현재는 저장하지 않음, UI만 존재)
  - 이름 입력
  - 연락처 입력 (3개 필드로 분리)
  - 이메일 입력 (선택사항)
  - 실시간 유효성 검사
  - 에러 메시지 표시
  - 중복 학번 체크
  - 회원가입 완료 후 홈으로 이동

## 🎯 사용 방법

### 1. 백엔드 서버 실행
```bash
cd /Users/jinho/개발/schoolBus/backend
source venv/bin/activate
uvicorn main:app --reload
```

### 2. 프론트엔드 서버 실행
```bash
cd /Users/jinho/개발/schoolBus/frontend
npm run dev
```

### 3. 회원가입 페이지 접속
- URL: `http://localhost:5173/register`

### 4. 회원가입 테스트
1. 학번/교번 입력 (예: `20240001`)
2. 비밀번호 입력 (현재는 저장되지 않음)
3. 비밀번호 확인
4. 이름 입력 (예: `홍길동`)
5. 연락처 입력 (예: `010-1234-5678`)
6. 이메일 입력 (선택, 예: `test@example.com`)
7. "저장하기" 버튼 클릭

## 📝 유효성 검사

### 필수 입력 항목
- ✅ 학번/교번
- ✅ 비밀번호 (4자 이상)
- ✅ 비밀번호 확인 (일치 여부)
- ✅ 이름
- ✅ 연락처 (3개 필드 모두)

### 선택 입력 항목
- 📧 이메일 (입력 시 형식 검증)

## 🔄 API 요청/응답 예시

### 요청 (Request)
```json
POST http://localhost:8000/api/users/register
Content-Type: application/json

{
  "student_id": "20240001",
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678"
}
```

### 성공 응답 (Response)
```json
{
  "message": "회원가입이 완료되었습니다.",
  "user": {
    "id": "uuid-here",
    "student_id": "20240001",
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-1234-5678"
  }
}
```

### 에러 응답 (중복 학번)
```json
{
  "detail": "이미 등록된 학번입니다."
}
```

## 🎨 UI 특징

### 입력 폼
- 깔끔한 테이블 레이아웃
- 필수 항목에 `*` 표시
- Placeholder로 입력 가이드 제공
- 전화번호는 3개 필드로 분리 (010-1234-5678)

### 에러 처리
- 실시간 유효성 검사
- 빨간색 에러 메시지 표시
- 중복 학번 알림
- 서버 연결 실패 알림

### 버튼 상태
- 기본: 검은색 배경
- Hover: 회색으로 변경
- 제출 중: "처리 중..." 표시 및 비활성화

## 🔐 보안 고려사항

### 현재 상태
- ⚠️ 비밀번호는 UI에만 존재하며 저장되지 않음
- ⚠️ 인증 기능 없음 (추후 구현 예정)

### 추후 개선 사항
1. **비밀번호 해싱**: bcrypt 또는 argon2 사용
2. **JWT 인증**: 로그인/로그아웃 기능
3. **이메일 인증**: 회원가입 시 이메일 확인
4. **학번 검증**: 실제 학번 형식 검증
5. **Rate Limiting**: API 호출 제한

## 📊 데이터베이스 확인

### Supabase에서 확인
1. Supabase 대시보드 접속
2. Table Editor 선택
3. `users` 테이블 확인
4. 등록된 회원 정보 확인

### SQL 쿼리로 확인
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

## 🐛 트러블슈팅

### 1. "서버에 연결할 수 없습니다"
- 백엔드 서버가 실행 중인지 확인
- `http://localhost:8000/docs`에서 API 문서 확인

### 2. "이미 등록된 학번입니다"
- 다른 학번으로 시도
- 또는 Supabase에서 해당 학번 삭제 후 재시도

### 3. Supabase 연결 오류
- `.env` 파일에 Supabase URL과 Key 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

## 🚀 다음 단계

1. **로그인 기능**: 학번으로 로그인
2. **마이페이지**: 회원 정보 수정
3. **예약 기능**: 회원만 버스 예약 가능
4. **푸시 알림**: FCM/APN 토큰 등록
5. **관리자 기능**: 회원 관리 페이지

## 📞 문의

문제가 발생하면 다음을 확인하세요:
1. 백엔드 서버 로그 (`uvicorn` 터미널)
2. 프론트엔드 콘솔 (브라우저 개발자 도구)
3. Supabase 로그 (Supabase 대시보드)
