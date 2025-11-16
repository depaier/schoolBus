# SchoolBus

React + FastAPI 풀스택 프로젝트

## 프로젝트 구조

```
schoolBus/
├── backend/          # FastAPI 백엔드
│   ├── main.py      # FastAPI 애플리케이션 진입점
│   ├── api/         # API 라우터
│   │   ├── __init__.py
│   │   └── routes/
│   │       └── example.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
│
└── frontend/        # React 프론트엔드 (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── services/
    │   │   └── api.js  # API 통신 유틸리티
    │   └── ...
    ├── package.json
    ├── .env
    └── .env.example
```

## 시작하기

### 1. 백엔드 설정 (FastAPI)

```bash
# backend 디렉토리로 이동
cd backend

# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env

# 서버 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 서버: http://localhost:8000
API 문서: http://localhost:8000/docs

### 2. 프론트엔드 설정 (React)

```bash
# frontend 디렉토리로 이동
cd frontend

# 의존성 설치 (이미 설치되어 있음)
npm install

# 환경변수 확인
# .env 파일이 생성되어 있는지 확인

# 개발 서버 실행
npm run dev
```

프론트엔드 서버: http://localhost:5173

## API 엔드포인트

### 기본 엔드포인트
- `GET /` - 루트 엔드포인트
- `GET /health` - 헬스 체크

### 예제 API
- `GET /api/example` - 모든 예제 데이터 조회
- `GET /api/example/{item_id}` - 특정 예제 데이터 조회

## 개발 가이드

### 백엔드 개발
1. `backend/api/routes/`에 새로운 라우터 파일 생성
2. `backend/api/__init__.py`에 라우터 등록
3. FastAPI 문서에서 자동으로 API 문서 생성됨

### 프론트엔드 개발
1. `frontend/src/services/api.js`에 API 호출 함수 추가
2. React 컴포넌트에서 API 함수 사용
3. 환경변수는 `VITE_` 접두사 필요

## 기술 스택

### Backend
- **FastAPI** - 현대적인 Python 웹 프레임워크
- **Uvicorn** - ASGI 서버
- **Pydantic** - 데이터 검증

### Frontend
- **React** - UI 라이브러리
- **Vite** - 빌드 도구
- **JavaScript** - 프로그래밍 언어

## 환경변수

### Backend (.env)
```
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## 다음 단계

- [ ] 데이터베이스 연동 (PostgreSQL, MongoDB 등)
- [ ] 인증/인가 시스템 구현
- [ ] 프론트엔드 라우팅 (React Router)
- [ ] 상태 관리 (Redux, Zustand 등)
- [ ] UI 라이브러리 추가 (TailwindCSS, shadcn/ui 등)
- [ ] 테스트 코드 작성
- [ ] Docker 컨테이너화
- [ ] 배포 설정
# test