# 빠른 테스트 가이드 🚀

## 즉시 실행

### 1️⃣ 백엔드 실행

```bash
cd backend
source venv/bin/activate
python main.py
```

**확인사항:**
- `VAPID 키 로드 완료` 메시지가 보여야 함
- 에러 없이 서버 시작

### 2️⃣ iPhone에서 알림 활성화 확인

1. **Supabase 확인**
   ```
   https://supabase.com/dashboard
   → users 테이블
   → notification_enabled = true 확인
   → push_subscription에 데이터 있는지 확인
   ```

2. **구독 정보 확인**
   ```json
   {
     "endpoint": "https://web.push.apple.com/...",
     "keys": {
       "p256dh": "...",
       "auth": "..."
     }
   }
   ```

### 3️⃣ Admin 페이지에서 푸시 전송

1. **PC 브라우저에서**
   ```
   http://localhost:5173/admin
   또는
   https://92044b218e7f.ngrok-free.app/admin
   ```

2. **노선 "예매 오픈" 클릭**

3. **백엔드 로그 확인**
   ```
   예매 오픈 감지 - 푸시 알림 전송 시작
   📤 푸시 알림 전송 시도: https://web.push.apple.com/...
   📡 HTTP 응답: 201 (또는 200, 202)
   ✅ 푸시 알림 전송 성공
   ```

4. **iPhone에서 알림 확인**
   - 🎉 통학버스 예매 오픈!
   - 통학버스 예매가 오픈되었습니다. 지금 바로 예매하세요!

## 문제 해결

### HTTP 응답 코드별 의미

| 코드 | 의미 | 해결 방법 |
|------|------|-----------|
| **201/200/202** | ✅ 성공 | 정상! iPhone 확인 |
| **400** | ❌ 잘못된 요청 | VAPID 키 문제 |
| **401** | ❌ 인증 실패 | JWT 토큰 문제 |
| **404** | ❌ 엔드포인트 없음 | 구독 재등록 |
| **410** | ❌ 구독 만료 | 자동 삭제됨 |

### 백엔드 로그에 에러가 있다면

**"VAPID 개인 키가 없습니다"**
```bash
cd backend
python check_vapid_setup.py
```

**"구독 정보가 불완전합니다"**
```
Supabase → users 테이블 → push_subscription 확인
endpoint, p256dh, auth 모두 있어야 함
```

**"JWT 생성 실패"**
```
.env 파일의 VAPID_PRIVATE_KEY_PEM 형식 확인
-----BEGIN PRIVATE KEY----- 로 시작해야 함
```

### iPhone에서 알림이 안 온다면

1. **iPhone 설정 확인**
   ```
   설정 → Safari → 알림 → 허용
   ```

2. **홈 화면에 추가했나요?**
   ```
   Safari → 공유 → 홈 화면에 추가
   ```

3. **앱이 실행 중인가요?**
   ```
   완전히 종료하지 말고 백그라운드로
   ```

4. **Service Worker 등록 확인**
   ```
   Safari 개발자 도구 → 콘솔
   "Service Worker 등록 성공" 메시지 확인
   ```

## 테스트 스크립트

직접 푸시를 보내보고 싶다면:

```bash
cd backend
source venv/bin/activate
python test_push.py
```

이 스크립트는:
1. VAPID 키 확인
2. Supabase에서 구독 정보 조회
3. 테스트 푸시 알림 전송
4. 결과 출력

## 핵심 체크리스트

- [ ] 백엔드 실행 중
- [ ] VAPID 키 로드 완료
- [ ] Supabase에 구독 정보 있음
- [ ] notification_enabled = true
- [ ] Admin에서 예매 오픈 클릭
- [ ] 백엔드 로그에 "푸시 알림 전송 성공"
- [ ] iPhone에 알림 도착!

## 예상 백엔드 로그

```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     VAPID 키 로드 완료
INFO:     Application startup complete.

# Admin에서 예매 오픈 클릭 시:
INFO:     예매 오픈 감지 - 푸시 알림 전송 시작
INFO:     1명의 사용자에게 푸시 알림 전송 시도
INFO:     📤 푸시 알림 전송 시도: https://web.push.apple.com/QFJ8sma8JZApfYxplbJdyRo87_F7LrhbNFEzpker_EDW...
INFO:     📡 HTTP 응답: 201
INFO:     ✅ 푸시 알림 전송 성공
INFO:     멀티캐스트 완료: 성공 1, 실패 0
INFO:     푸시 알림 전송 결과: {'success_count': 1, 'failure_count': 0, 'expired_subscriptions': []}
```

## 다음 단계

1. ✅ 백엔드 실행
2. ✅ Admin에서 예매 오픈
3. ✅ 백엔드 로그 확인
4. ✅ iPhone 알림 확인

**지금 바로 테스트하세요!** 🚀
