# VAPID 키 불일치 해결 가이드 🔑

## 문제

```
{"reason":"VapidPkHashMismatch"}
```

**의미**: 프론트엔드에서 구독할 때 사용한 VAPID 공개 키와 백엔드에서 푸시를 보낼 때 사용한 VAPID 공개 키가 다릅니다.

## 원인

1. 백엔드에서 새로운 VAPID 키 생성
2. 프론트엔드 `.env`에 새 공개 키 업데이트
3. **하지만 사용자는 아직 이전 키로 구독되어 있음!**

## 해결 방법

### 1️⃣ 프론트엔드 재시작

```bash
cd frontend
npm run dev
```

프론트엔드를 재시작해야 새로운 VAPID 공개 키가 적용됩니다.

### 2️⃣ 모든 사용자 재등록 필요

**각 사용자(iPhone)에서:**

1. **기존 구독 삭제 (선택사항)**
   ```
   홈 페이지 → 알림 비활성화 (있다면)
   ```

2. **페이지 완전 새로고침**
   ```
   Safari → 새로고침 (Cmd+Shift+R)
   또는 앱 완전히 닫고 다시 열기
   ```

3. **알림 재등록**
   ```
   홈 페이지 → "알림 받기" 클릭 → 알림 허용
   ```

4. **Supabase 확인**
   ```
   users 테이블 → push_subscription 업데이트 확인
   ```

### 3️⃣ 테스트

```bash
cd backend
python test_push.py
```

**예상 결과:**
```
📡 HTTP 응답: 201
✅ 푸시 알림 전송 성공
```

## 현재 VAPID 키

### 백엔드 (.env)
```
VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
```

### 프론트엔드 (.env)
```
VITE_VAPID_PUBLIC_KEY=BM7-GLEATms5xDWJHg9XKTFm0zXYBlSDCXDTK4LlZVbCVGyAJbph9cJXEF3KLVhC0wfE9U6O0fJi4Wh8iUGfYk0
```

**두 키가 동일해야 합니다!**

## 자동화 스크립트 (선택사항)

모든 사용자의 구독을 초기화하려면:

```sql
-- Supabase SQL Editor에서 실행
UPDATE users 
SET push_subscription = NULL, 
    notification_enabled = FALSE;
```

그 후 모든 사용자가 다시 알림을 활성화해야 합니다.

## 체크리스트

- [ ] 백엔드 `.env`에 새 VAPID 키 있음
- [ ] 프론트엔드 `.env`에 새 VAPID 키 있음 (동일한 공개 키)
- [ ] 프론트엔드 재시작
- [ ] 사용자가 알림 재등록
- [ ] Supabase에 새 구독 정보 저장됨
- [ ] 테스트 성공!

## 왜 이런 일이 발생했나요?

VAPID 키는 **구독 시점**에 브라우저에 저장됩니다. 

1. 사용자가 **이전 키 A**로 구독
2. 백엔드에서 **새 키 B** 생성
3. 백엔드가 **키 B**로 푸시 전송
4. 브라우저는 **키 A**로 구독되어 있음
5. **불일치!** → `VapidPkHashMismatch`

## 해결책

사용자가 **새 키로 재구독**해야 합니다!

**지금 바로 프론트엔드를 재시작하고 알림을 재등록하세요!** 🚀
