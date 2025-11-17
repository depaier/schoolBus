# 통학버스 예매 비동기 폴러 시스템

통학버스 예매가 열릴 때 사용자에게 자동으로 알림을 보내는 비동기 폴링 시스템입니다.

## 📁 구조

```
poller/
├── __init__.py                 # 모듈 초기화
├── poller_service.py           # 비동기 폴러 서비스 (핵심 로직)
├── notification_handler.py     # 알림 핸들러
├── test_poller.py              # 테스트 스크립트
└── README.md                   # 문서
```

## 🚀 주요 기능

### 1. BusReservationPoller (폴러 서비스)
- **비동기 폴링**: 설정된 주기(기본 30초)마다 예매 상태 체크
- **상태 변경 감지**: 예매가 닫혀있다가 열린 경우를 자동 감지
- **콜백 시스템**: 예매 오픈 시 알림 콜백 자동 실행
- **통계 수집**: 체크 횟수, 실행 상태 등 통계 정보 제공

### 2. NotificationHandler (알림 핸들러)
- **알림 전송**: 예매 오픈 시 알림 생성 및 전송
- **히스토리 관리**: 모든 알림 기록 저장 및 조회
- **확장 가능**: 이메일, 푸시, SMS 등 다양한 알림 채널 추가 가능

## 🧪 테스트 실행 방법

### 기본 실행 (30초 주기)
```bash
cd /Users/jinho/개발/schoolBus/backend/poller
python test_poller.py
```

### 커스텀 주기로 실행 (예: 10초)
```bash
python test_poller.py 10
```

### 종료
- `Ctrl+C`를 눌러 안전하게 종료

## 📊 테스트 시나리오

테스트 스크립트는 다음과 같이 동작합니다:

1. **폴러 시작**: 설정된 주기마다 예매 상태 체크 시작
2. **체크 시뮬레이션**: 5번째 체크에서 예매가 열린 것으로 시뮬레이션
3. **알림 발송**: 예매 오픈 감지 시 자동으로 알림 전송
4. **통계 출력**: 2회 체크마다 현재 통계 출력
5. **종료 시 요약**: 프로그램 종료 시 전체 통계 및 알림 히스토리 출력

## 💡 실제 사용 예시

### 1. 독립 실행형 (테스트용)
```python
import asyncio
from poller_service import BusReservationPoller
from notification_handler import NotificationHandler

async def main():
    handler = NotificationHandler()
    poller = BusReservationPoller(
        check_interval=30,
        notification_callback=handler.send_notification
    )
    
    await poller.start()
    
    # 5분간 실행
    await asyncio.sleep(300)
    
    await poller.stop()

asyncio.run(main())
```

### 2. FastAPI와 통합
```python
from fastapi import FastAPI
from poller import BusReservationPoller, NotificationHandler

app = FastAPI()
poller = None

@app.on_event("startup")
async def startup_event():
    global poller
    handler = NotificationHandler()
    poller = BusReservationPoller(
        check_interval=30,
        notification_callback=handler.send_notification
    )
    await poller.start()

@app.on_event("shutdown")
async def shutdown_event():
    if poller:
        await poller.stop()

@app.get("/poller/stats")
async def get_poller_stats():
    return poller.get_stats()
```

## 🔧 커스터마이징

### 체크 주기 변경
```python
poller = BusReservationPoller(check_interval=60)  # 60초마다 체크
```

### 커스텀 체크 로직 구현
`poller_service.py`의 `check_reservation_status()` 메서드를 수정하여 실제 API 호출 또는 웹 스크래핑 로직을 구현하세요:

```python
async def check_reservation_status(self) -> Dict[str, Any]:
    # 실제 통학버스 시스템 API 호출
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.example.com/bus/status") as response:
            data = await response.json()
            return {
                "timestamp": datetime.now().isoformat(),
                "is_open": data["is_open"],
                "route_info": data["route_info"]
            }
```

### 알림 채널 추가
`notification_handler.py`의 `send_notification()` 메서드에 실제 알림 전송 로직을 추가하세요:

```python
async def send_notification(self, status: Dict[str, Any]):
    # 기존 로직...
    
    # 이메일 전송
    await send_email(user_email, notification_data)
    
    # 푸시 알림
    await send_push_notification(user_id, notification_data)
    
    # SMS 전송
    await send_sms(user_phone, notification_data["message"])
```

## 📝 로그 출력 예시

```
2024-01-01 12:00:00 - __main__ - INFO - 폴러 시작 - 30초마다 체크
2024-01-01 12:00:00 - __main__ - INFO - 체크 #1 - 예매 오픈 상태: False
2024-01-01 12:00:30 - __main__ - INFO - 체크 #2 - 예매 오픈 상태: False
2024-01-01 12:01:00 - __main__ - INFO - 체크 #3 - 예매 오픈 상태: False
2024-01-01 12:01:30 - __main__ - INFO - 체크 #4 - 예매 오픈 상태: False
2024-01-01 12:02:00 - __main__ - INFO - 체크 #5 - 예매 오픈 상태: True
2024-01-01 12:02:00 - __main__ - INFO - 🎉 예매가 열렸습니다!
============================================================
📢 통학버스 예매 오픈!
메시지: 등교 노선 A 예매가 오픈되었습니다! 출발시간: 08:00, 남은 좌석: 15석
노선: 등교 노선 A
출발 시간: 08:00
남은 좌석: 15석
============================================================
```

## 🔄 다음 단계

1. **실제 API 연동**: `check_reservation_status()` 메서드에 실제 통학버스 시스템 API 호출 로직 구현
2. **알림 시스템 연동**: 이메일, 푸시 알림, SMS 등 실제 알림 채널 구현
3. **데이터베이스 연동**: 사용자 정보, 알림 설정, 히스토리 저장
4. **FastAPI 통합**: 백엔드 API와 통합하여 웹 인터페이스 제공
5. **에러 처리 강화**: 네트워크 오류, API 오류 등 예외 상황 처리
6. **모니터링**: 폴러 상태 모니터링 및 알림 시스템 구축

## 🛠️ 필요한 추가 패키지

실제 구현 시 필요할 수 있는 패키지들:

```bash
pip install aiohttp          # HTTP 비동기 요청
pip install beautifulsoup4   # 웹 스크래핑
pip install aiosmtplib       # 비동기 이메일 전송
pip install python-telegram-bot  # 텔레그램 봇
```
