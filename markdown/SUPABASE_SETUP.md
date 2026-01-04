# Supabase 설정 가이드

## 📋 1단계: Supabase 프로젝트 설정

이미 제공된 정보:
- **Project URL**: `https://ojadgvbfxvjvrswnwdzh.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🗄️ 2단계: 데이터베이스 테이블 생성

Supabase 대시보드에서 SQL Editor를 열고 다음 파일의 SQL을 실행하세요:

```bash
backend/supabase_schema.sql
```

또는 Supabase 대시보드에서:
1. **SQL Editor** 메뉴로 이동
2. **New Query** 클릭
3. `supabase_schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭

이렇게 하면 다음 테이블들이 생성됩니다:
- `bus_routes` - 버스 노선 정보
- `reservation_status` - 예매 전체 상태
- `reservations` - 예매 기록 (선택사항)

## 🔧 3단계: 백엔드 설정

### 3.1 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

### 3.2 환경 변수 확인

`.env` 파일이 자동으로 생성되었습니다. 내용 확인:

```bash
cat .env
```

다음과 같이 설정되어 있어야 합니다:

```env
SUPABASE_URL=https://ojadgvbfxvjvrswnwdzh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 백엔드 서버 실행

```bash
uvicorn main:app --reload
```

서버가 `http://localhost:8000`에서 실행됩니다.

## 🎨 4단계: 프론트엔드 설정

### 4.1 의존성 설치 (이미 완료)

```bash
cd frontend
npm install
```

### 4.2 프론트엔드 실행

```bash
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

## 🧪 5단계: 테스트

### 5.1 API 테스트

브라우저에서 다음 URL들을 확인:

- **예매 상태 조회**: http://localhost:8000/api/reservation/status
- **노선 목록 조회**: http://localhost:8000/api/routes
- **API 문서**: http://localhost:8000/docs

### 5.2 전체 플로우 테스트

1. **관리자 페이지** (`http://localhost:5173/admin`) 접속
2. 노선이 Supabase에서 로드되는지 확인
3. "예매 오픈" 버튼 클릭
4. **홈 페이지** (`http://localhost:5173/`) 접속
5. "알림 받기" 버튼 클릭
6. "실시간 모니터링 시작" 클릭
7. 관리자 페이지에서 예매 오픈 시 Push 알림 수신 확인

## 📊 Supabase 대시보드에서 데이터 확인

1. Supabase 대시보드 접속
2. **Table Editor** 메뉴로 이동
3. 다음 테이블들을 확인:
   - `bus_routes` - 노선 데이터
   - `reservation_status` - 예매 상태

## 🔄 주요 변경 사항

### 이전 (메모리 기반)
```python
# reservation_state.py
reservation_state = {
    "is_open": False,
    "updated_at": None
}
```

### 현재 (Supabase 기반)
```python
# Supabase에서 조회
response = supabase.table("reservation_status").select("*").execute()
```

## 🎯 API 엔드포인트

### 예매 상태
- `GET /api/reservation/status` - 예매 상태 조회
- `POST /api/reservation/update` - 예매 상태 변경

### 버스 노선
- `GET /api/routes` - 모든 노선 조회
- `GET /api/routes/{route_id}` - 특정 노선 조회
- `POST /api/routes` - 새 노선 생성
- `PUT /api/routes/{route_id}` - 노선 정보 업데이트
- `DELETE /api/routes/{route_id}` - 노선 삭제
- `POST /api/routes/{route_id}/toggle` - 노선 오픈/닫기 토글

## 🐛 문제 해결

### 1. "데이터베이스 오류" 발생 시
- Supabase URL과 Key가 올바른지 확인
- SQL 스크립트가 정상적으로 실행되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 2. "노선 데이터 로드 실패" 발생 시
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인 (main.py에 이미 설정됨)
- 브라우저 콘솔에서 에러 메시지 확인

### 3. Row Level Security (RLS) 문제
- 현재는 모든 사용자가 읽기/쓰기 가능하도록 설정됨
- 실제 프로덕션에서는 관리자 role을 만들어 제한 필요

## 🔒 보안 고려사항

현재 설정은 개발/테스트용입니다. 프로덕션 배포 시:

1. **Service Role Key 사용**: 백엔드에서는 Service Role Key 사용
2. **RLS 정책 강화**: 관리자 role 생성 및 권한 제한
3. **환경 변수 보호**: .env 파일을 .gitignore에 추가 (이미 추가됨)
4. **API 인증**: JWT 토큰 기반 인증 추가

## ✅ 완료!

이제 Supabase를 사용하는 통학버스 예매 시스템이 완성되었습니다! 🎉

모든 데이터는 Supabase에 저장되며, 서버를 재시작해도 데이터가 유지됩니다.
