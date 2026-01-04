# Vercel 배포 가이드 - SchoolBus 프로젝트

## 📋 배포 전략

**Framework Preset**: Vite (Frontend)  
**Backend**: Vercel Serverless Functions (FastAPI)  
**통합 배포**: 단일 Vercel 프로젝트로 Frontend + Backend 동시 배포

---

## 🚀 배포 단계

### 1단계: Vercel 프로젝트 생성

1. **Vercel 계정 로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "Add New" → "Project" 클릭
   - GitHub 저장소 연결
   - `schoolBus` 저장소 선택

3. **Framework Preset 선택**
   - Framework Preset: **Vite**
   - Root Directory: `./` (루트)
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`

---

### 2단계: 환경 변수 설정

Vercel 프로젝트 설정에서 다음 환경 변수를 추가하세요:

#### Frontend 환경 변수
```bash
VITE_API_URL=/api
VITE_VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQS...
```

#### Backend 환경 변수
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# VAPID (Web Push)
VAPID_PUBLIC_KEY=BFck11zXbEONejnWRA5c-E3ktU8o52e_txdmeaDRVTAzwQEQS...
VAPID_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2mmhlUF8sf7nu43O
...
-----END PRIVATE KEY-----

# Firebase (Optional)
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# Python
PYTHONPATH=/var/task
```

**⚠️ 중요**: 
- VAPID_PRIVATE_KEY_PEM은 여러 줄이므로 Vercel에서 그대로 붙여넣기
- Firebase credentials는 별도 처리 필요 (아래 참고)

---

### 3단계: Firebase Credentials 설정 (선택사항)

Firebase를 사용하는 경우:

**방법 1: 환경 변수로 설정**
```bash
# Vercel 환경 변수에 추가
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"..."}'
```

**방법 2: Vercel Blob Storage 사용**
```bash
# backend/main.py에서 환경 변수로 읽기
import json
import os

firebase_creds = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
```

---

### 4단계: 배포 설정 확인

#### vercel.json 파일 확인
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    },
    {
      "src": "backend/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/main.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "/api"
  },
  "outputDirectory": "frontend/dist"
}
```

#### package.json (루트) 확인
```json
{
  "name": "schoolbus",
  "version": "1.0.0",
  "scripts": {
    "build": "cd frontend && npm install && npm run build"
  }
}
```

---

### 5단계: 배포 실행

1. **Git Push**
   ```bash
   git add .
   git commit -m "Add Vercel deployment config"
   git push origin main
   ```

2. **자동 배포**
   - Vercel이 자동으로 빌드 시작
   - 빌드 로그 확인

3. **배포 완료**
   - 배포 URL 확인: `https://your-project.vercel.app`

---

## 🔧 주요 수정 사항

### 1. Frontend 환경 변수 변경

**기존** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:8000
```

**변경** (Vercel 배포 시):
```bash
VITE_API_URL=/api
```

→ Vercel에서는 상대 경로로 API 호출

### 2. Backend CORS 설정

**기존** (`backend/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**변경** (프로덕션):
```python
import os

# 환경에 따라 CORS 설정
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Vercel 환경 변수 추가:
```bash
ALLOWED_ORIGINS=https://your-project.vercel.app,https://www.your-domain.com
```

### 3. Serverless Functions 제약 사항

Vercel Serverless Functions는 다음 제약이 있습니다:

- **실행 시간 제한**: 10초 (Hobby), 60초 (Pro)
- **메모리 제한**: 1024MB (Hobby), 3008MB (Pro)
- **Cold Start**: 첫 요청 시 지연 발생 가능

**⚠️ Poller Service 문제**:
- 백그라운드 폴링(`backend/poller/`)은 Serverless에서 작동 불가
- 대안: Vercel Cron Jobs 또는 외부 서비스 사용

---

## 🛠️ Poller Service 대안

### 방법 1: Vercel Cron Jobs (추천)

**vercel.json에 추가**:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-reservation",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**backend/api/routes/cron.py 생성**:
```python
from fastapi import APIRouter, Header, HTTPException

router = APIRouter()

@router.get("/cron/check-reservation")
async def check_reservation_cron(authorization: str = Header(None)):
    # Vercel Cron Secret 검증
    if authorization != f"Bearer {os.getenv('CRON_SECRET')}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # 예매 상태 체크 로직
    # ...
    
    return {"status": "success"}
```

Vercel 환경 변수:
```bash
CRON_SECRET=your-random-secret-key
```

### 방법 2: 외부 Cron 서비스

- **Cron-job.org**: 무료 cron 서비스
- **EasyCron**: 간단한 설정
- **GitHub Actions**: 워크플로우로 주기적 실행

---

## 📊 배포 후 확인 사항

### 1. Frontend 확인
- [ ] 홈 페이지 로딩 (`/`)
- [ ] 로그인 페이지 (`/login`)
- [ ] 회원가입 페이지 (`/register`)
- [ ] 관리자 페이지 (`/admin`)
- [ ] Service Worker 등록 확인 (DevTools > Application)

### 2. Backend API 확인
- [ ] API 문서: `https://your-project.vercel.app/api/docs`
- [ ] Health Check: `https://your-project.vercel.app/api/health`
- [ ] 노선 조회: `https://your-project.vercel.app/api/routes`
- [ ] 사용자 등록: `https://your-project.vercel.app/api/users/register`

### 3. 푸시 알림 확인
- [ ] 알림 권한 요청
- [ ] 푸시 구독 생성
- [ ] Supabase에 구독 정보 저장
- [ ] 테스트 알림 발송

### 4. 성능 확인
- [ ] Lighthouse 점수 (Performance, SEO, Accessibility)
- [ ] API 응답 시간
- [ ] Cold Start 시간

---

## 🐛 트러블슈팅

### 문제 1: API 호출 실패 (404)

**원인**: API 경로 불일치

**해결**:
1. Frontend `.env` 확인: `VITE_API_URL=/api`
2. `vercel.json` routes 확인
3. Backend 라우터 prefix 확인: `app.include_router(api_router, prefix="/api")`

### 문제 2: CORS 에러

**원인**: CORS 설정 문제

**해결**:
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-project.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 문제 3: 환경 변수 인식 안 됨

**원인**: Vercel 환경 변수 미설정

**해결**:
1. Vercel Dashboard > Settings > Environment Variables
2. 모든 환경 변수 추가
3. Redeploy

### 문제 4: Service Worker 등록 실패

**원인**: HTTPS 필요

**해결**:
- Vercel은 자동으로 HTTPS 제공
- Custom Domain 사용 시 SSL 인증서 자동 발급

### 문제 5: Serverless Function Timeout

**원인**: 실행 시간 초과 (10초)

**해결**:
1. 쿼리 최적화
2. 데이터베이스 인덱스 추가
3. 캐싱 적용
4. Pro 플랜 업그레이드 (60초)

---

## 🔒 보안 체크리스트

- [ ] 환경 변수에 민감 정보 저장 (코드에 하드코딩 금지)
- [ ] CORS 설정을 특정 도메인으로 제한
- [ ] Supabase RLS 정책 활성화
- [ ] API Rate Limiting 적용
- [ ] HTTPS 강제 (Vercel 자동 제공)
- [ ] Firebase Credentials 안전하게 관리

---

## 📈 성능 최적화

### Frontend
- [ ] Code Splitting (React.lazy)
- [ ] Image Optimization (WebP)
- [ ] Tree Shaking (Vite 자동)
- [ ] Gzip/Brotli 압축 (Vercel 자동)
- [ ] CDN 캐싱 (Vercel Edge Network)

### Backend
- [ ] 데이터베이스 쿼리 최적화
- [ ] 응답 캐싱 (Redis 또는 Vercel KV)
- [ ] 비동기 처리 (async/await)
- [ ] Connection Pooling (Supabase)

---

## 🌐 Custom Domain 연결

1. **Vercel Dashboard**
   - Settings > Domains
   - "Add Domain" 클릭

2. **DNS 설정**
   - A Record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`

3. **SSL 인증서**
   - Vercel이 자동으로 Let's Encrypt 인증서 발급

---

## 📚 참고 자료

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/concepts/)

---

## ✅ 배포 완료 후

배포가 완료되면:

1. **URL 공유**
   - 프로젝트 URL: `https://your-project.vercel.app`
   - API 문서: `https://your-project.vercel.app/api/docs`

2. **모니터링**
   - Vercel Analytics 활성화
   - 에러 로그 확인

3. **사용자 테스트**
   - 실제 사용자 피드백 수집
   - 버그 수정 및 개선

---

**🎉 배포 성공을 기원합니다!**
