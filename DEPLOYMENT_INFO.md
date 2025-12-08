# 배포 정보

## 🌐 프로덕션 환경

### 배포 URL
- **Frontend & API**: https://school-bus-psi.vercel.app/
- **API 문서**: https://school-bus-psi.vercel.app/api/docs
- **Health Check**: https://school-bus-psi.vercel.app/api/health

### 배포 플랫폼
- **Vercel** (Frontend + Backend Serverless Functions)
- **Framework**: Vite (Frontend)
- **Runtime**: Python 3.12 (Backend)

---

## 🔧 환경 변수

### Vercel 환경 변수 (설정 완료)

#### Frontend
```
VITE_API_URL=/api
VITE_VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
```

#### Backend
```
SUPABASE_URL=[설정 필요]
SUPABASE_KEY=[설정 필요]
VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
VAPID_PRIVATE_KEY_PEM=[설정 필요]
ALLOWED_ORIGINS=https://school-bus-psi.vercel.app
PYTHONPATH=/var/task
```

---

## 📋 로컬 개발 환경

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
```

### Backend (.env)
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_anon_key
VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
VAPID_PRIVATE_KEY_PEM=[비공개 키]
ALLOWED_ORIGINS=*
```

---

## 🚀 배포 프로세스

### 자동 배포
1. `main` 브랜치에 push
2. Vercel이 자동으로 빌드 및 배포
3. 배포 완료 후 URL 업데이트

### 수동 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

---

## 📊 모니터링

### Vercel Dashboard
- **빌드 로그**: https://vercel.com/dashboard
- **Analytics**: 트래픽 및 성능 지표
- **Logs**: 실시간 에러 로그

### 주요 지표
- **빌드 시간**: ~2분
- **Cold Start**: ~1-2초
- **API 응답 시간**: ~100-300ms

---

## 🔒 보안

### CORS 설정
- **프로덕션**: `https://school-bus-psi.vercel.app`만 허용
- **로컬 개발**: 모든 origin 허용 (`*`)

### 환경 변수 관리
- Vercel Dashboard에서 안전하게 관리
- `.env` 파일은 Git에 커밋하지 않음
- `.env.example` 파일로 템플릿 제공

---

## 🛠️ 트러블슈팅

### API 호출 실패
1. Vercel 환경 변수 확인
2. CORS 설정 확인
3. API 경로 확인 (`/api/...`)

### 빌드 실패
1. 의존성 버전 확인
2. 빌드 로그 확인
3. `vercel.json` 설정 확인

### Service Worker 문제
1. 브라우저 캐시 삭제
2. HTTPS 확인 (Vercel 자동 제공)
3. DevTools > Application 탭 확인

---

## 📚 관련 문서

- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - 상세 배포 가이드
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 체크리스트
- [README.md](./README.md) - 프로젝트 개요

---

**마지막 업데이트**: 2025년 12월 8일
