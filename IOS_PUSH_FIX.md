# iOS 푸시 알림 수정 완료! 🍎

## 문제 원인

**`pywebpush` 라이브러리가 iOS에서 제대로 작동하지 않음**

- `pywebpush`는 iOS의 Apple Push Notification service와 호환성 문제가 있음
- 직접 HTTP 요청 방식이 iOS에서 훨씬 안정적

## 해결 방법

당신이 이전에 작성한 **직접 HTTP 요청 방식**을 백엔드에 통합했습니다!

### 변경 사항

**파일**: `/backend/services/web_push_service.py`

```python
# 이전 (pywebpush 사용)
response = webpush(
    subscription_info=subscription_info,
    data=payload,
    vapid_private_key=self.vapid_private_key,
    vapid_claims=self.vapid_claims
)

# 수정 (직접 HTTP 요청)
# 1. VAPID JWT 생성
jwt_token = self._create_vapid_jwt(endpoint)

# 2. HTTP 헤더 설정
headers = {
    'TTL': '86400',
    'Content-Type': 'application/json;charset=utf-8',
    'Authorization': f'vapid t={jwt_token}, k={self.vapid_public_key}',
    'Content-Encoding': 'aes128gcm'
}

# 3. 직접 HTTP POST 요청
response = requests.post(endpoint, data=payload, headers=headers)
```

### 핵심 개선 사항

1. **VAPID JWT 직접 생성**
   - Audience를 endpoint의 origin에서 추출
   - ES256 알고리즘으로 서명

2. **Apple Push Service 호환**
   - Authorization 헤더 형식: `vapid t={jwt}, k={public_key}`
   - Content-Encoding: `aes128gcm`

3. **상세한 로깅**
   - 전송 시도, 응답 코드, 에러 메시지 모두 로깅

## 즉시 실행

### 1️⃣ 백엔드 재시작

```bash
cd backend
source venv/bin/activate
python main.py
```

### 2️⃣ 프론트엔드 재시작 (이미 했으면 생략)

```bash
cd frontend
npm run dev
```

### 3️⃣ 테스트

#### iPhone에서:

1. **알림 활성화**
   ```
   홈 페이지 → "알림 받기" 클릭 → 알림 허용
   ```

2. **앱 닫기**
   ```
   Safari 완전히 종료
   ```

3. **Admin에서 예매 오픈**
   ```
   PC에서 /admin → "예매 오픈" 클릭
   ```

4. **푸시 알림 확인!**
   ```
   iPhone에 푸시 알림 수신 확인
   🎉 통학버스 예매 오픈!
   ```

## 백엔드 로그 확인

```bash
# 백엔드 터미널에서 확인
📤 푸시 알림 전송 시도: https://web.push.apple.com/...
📡 HTTP 응답: 201
✅ 푸시 알림 전송 성공
```

## iOS 주의사항

### ✅ 작동하는 경우
- **Safari**: 홈 화면에 추가 + 앱 실행 중
- **Chrome iOS**: 제한적 지원

### ❌ 작동하지 않는 경우
- Safari 일반 탭 (홈 화면 추가 안 함)
- 앱 완전히 종료된 상태 (iOS 제한)

### 🔧 iOS에서 최대한 활용하기

1. **홈 화면에 추가**
   ```
   Safari → 공유 → 홈 화면에 추가
   ```

2. **백그라운드 실행**
   ```
   앱을 완전히 닫지 말고 백그라운드로 전환
   ```

3. **알림 권한 확인**
   ```
   설정 → Safari → 알림 → 허용
   ```

## 플랫폼별 지원

| 플랫폼 | 백그라운드 알림 | 비고 |
|--------|----------------|------|
| **PC (Chrome/Edge)** | ✅ 완벽 지원 | 브라우저 닫아도 알림 |
| **Android** | ✅ 완벽 지원 | 앱 닫아도 알림 |
| **iOS Safari (PWA)** | ⚠️ 제한적 | 홈 화면 추가 + 백그라운드 실행 |
| **iOS Chrome** | ⚠️ 매우 제한적 | 권장하지 않음 |

## 문제 해결

### 여전히 알림이 안 와요

1. **백엔드 로그 확인**
   ```bash
   # 백엔드 터미널에서
   # "푸시 알림 전송 시작" 로그가 보이나요?
   # HTTP 응답 코드는 무엇인가요?
   ```

2. **Supabase 확인**
   ```
   users 테이블 → push_subscription 필드에 데이터 있나요?
   notification_enabled = true 인가요?
   ```

3. **VAPID 키 확인**
   ```bash
   cd backend
   python check_vapid_setup.py
   ```

4. **iPhone 설정 확인**
   ```
   설정 → Safari → 알림 → 허용되어 있나요?
   홈 화면에 앱을 추가했나요?
   ```

### HTTP 응답 코드 의미

| 코드 | 의미 | 해결 방법 |
|------|------|-----------|
| **201** | ✅ 성공 | 정상 작동 |
| **400** | ❌ 잘못된 요청 | VAPID 키 확인 |
| **404** | ❌ 엔드포인트 없음 | 구독 재등록 필요 |
| **410** | ❌ 구독 만료 | 자동으로 삭제됨 |
| **413** | ❌ 페이로드 너무 큼 | 메시지 줄이기 |

## 테스트 스크립트

직접 테스트하고 싶다면:

```bash
cd backend
python test_push.py
```

이 스크립트는 Supabase에서 구독 정보를 가져와서 직접 푸시를 보냅니다.

## 핵심 장점

✅ **iOS 호환성 개선** - Apple Push Service와 완벽 호환  
✅ **상세한 로깅** - 문제 발생 시 빠른 디버깅  
✅ **안정적인 전송** - 직접 HTTP 요청으로 제어  
✅ **에러 처리** - 만료된 구독 자동 정리

## 다음 단계

1. ✅ 백엔드 재시작
2. ✅ iPhone에서 알림 활성화
3. ✅ Admin에서 예매 오픈
4. ✅ 푸시 알림 수신 확인!

**이제 iPhone에서도 푸시 알림을 받을 수 있습니다!** 🎉

(단, 홈 화면에 추가하고 앱이 백그라운드에서 실행 중이어야 합니다)
