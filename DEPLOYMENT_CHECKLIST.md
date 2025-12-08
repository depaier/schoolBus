# Vercel 배포 체크리스트

## ✅ 배포 전 준비

### 1. 파일 확인
- [x] `vercel.json` 생성됨
- [x] 루트 `package.json` 생성됨
- [x] `.vercelignore` 생성됨
- [x] `frontend/.env.production` 생성됨
- [x] `backend/main.py` CORS 설정 수정됨

### 2. Git 커밋
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

---

## 🚀 Vercel 배포 설정

### 1. Framework Preset
**선택**: Vite

### 2. Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install`
- **Root Directory**: `./` (루트)

### 3. 환경 변수 (Vercel Dashboard에서 설정)

#### Frontend 환경 변수
```
VITE_API_URL=/api
VITE_VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
```

#### Backend 환경 변수
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_anon_key
VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
VAPID_PRIVATE_KEY_PEM=-----BEGIN EC PRIVATE KEY-----
[여러 줄 비공개 키]
-----END EC PRIVATE KEY-----
ALLOWED_ORIGINS=https://your-project.vercel.app
PYTHONPATH=/var/task
```

**⚠️ 주의**: 
- 실제 Supabase URL과 Key로 교체 필요
- VAPID_PRIVATE_KEY_PEM은 backend/.env에서 복사
- ALLOWED_ORIGINS는 배포 후 실제 URL로 업데이트

---

## 📋 배포 단계

### 1단계: Vercel 프로젝트 생성
1. https://vercel.com 로그인
2. "Add New" → "Project"
3. GitHub 저장소 `schoolBus` 선택
4. Framework Preset: **Vite** 선택
5. Root Directory: `./` (변경 없음)

### 2단계: 환경 변수 설정
1. Settings → Environment Variables
2. 위의 모든 환경 변수 추가
3. Production, Preview, Development 모두 체크

### 3단계: 배포 실행
1. "Deploy" 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 대기 (약 2-3분)

### 4단계: 배포 후 설정
1. 배포 URL 확인: `https://school-bus-psi.vercel.app`
2. ALLOWED_ORIGINS 환경 변수 업데이트:
   ```
   ALLOWED_ORIGINS=https://school-bus-psi.vercel.app
   ```
3. Redeploy (Settings → Deployments → Redeploy)

✅ **완료**: 배포 URL이 https://school-bus-psi.vercel.app 로 확정되었습니다!

---

## 🧪 배포 후 테스트

### Frontend 테스트
- [ ] 홈 페이지: `https://your-project.vercel.app/`
- [ ] 로그인: `https://your-project.vercel.app/login`
- [ ] 회원가입: `https://your-project.vercel.app/register`
- [ ] 관리자: `https://your-project.vercel.app/admin`

### Backend API 테스트
- [ ] API 문서: `https://your-project.vercel.app/api/docs`
- [ ] Health Check: `https://your-project.vercel.app/api/health`
- [ ] 노선 조회: `https://your-project.vercel.app/api/routes`

### 기능 테스트
- [ ] 회원가입 → 로그인
- [ ] 노선 조회
- [ ] 알림 권한 요청
- [ ] 푸시 구독 생성
- [ ] 관리자 노선 관리

---

## ⚠️ 주의사항

### Poller Service 제약
Vercel Serverless Functions는 백그라운드 작업을 지원하지 않습니다.

**현재 상태**: `backend/poller/` 폴링 서비스는 작동하지 않음

**해결 방안**:
1. **Vercel Cron Jobs 사용** (추천)
   - 30초마다 실행은 불가 (최소 1분)
   - 1분마다 예매 상태 체크로 변경 필요

2. **외부 Cron 서비스**
   - Cron-job.org
   - EasyCron
   - GitHub Actions

3. **별도 서버 운영**
   - AWS EC2, Google Cloud Run 등에서 Poller만 실행
   - Supabase를 통해 상태 공유

---

## 🔧 트러블슈팅

### 문제: API 호출 404
**해결**: 
- Frontend `.env.production` 확인: `VITE_API_URL=/api`
- `vercel.json` routes 확인

### 문제: CORS 에러
**해결**:
- ALLOWED_ORIGINS 환경 변수 확인
- 실제 배포 URL로 설정

### 문제: 환경 변수 인식 안 됨
**해결**:
- Vercel Dashboard에서 환경 변수 재확인
- Redeploy 실행

### 문제: Service Worker 등록 실패
**해결**:
- Vercel은 자동 HTTPS 제공 (문제 없음)
- 브라우저 콘솔 확인

---

## 📊 성능 모니터링

### Vercel Analytics
1. Settings → Analytics
2. Enable Analytics
3. 트래픽, 성능 지표 확인

### Lighthouse 점수
- Performance: 90+ 목표
- SEO: 95+ 목표
- Accessibility: 90+ 목표

---

## 🎉 배포 완료!

배포가 성공하면:
1. 팀원들에게 URL 공유
2. 실제 사용자 테스트
3. 피드백 수집 및 개선

**프로젝트 URL**: `https://your-project.vercel.app`
