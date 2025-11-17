"""
폴러 테스트 스크립트
비동기 폴러를 실행하고 테스트하는 독립 실행 스크립트
"""
import asyncio
import signal
import sys
from .poller_service import BusReservationPoller
from .notification_handler import NotificationHandler


class PollerTester:
    """
    폴러 테스트 클래스
    """
    
    def __init__(self, check_interval: int = 30):
        self.notification_handler = NotificationHandler()
        self.poller = BusReservationPoller(
            check_interval=check_interval,
            notification_callback=self.notification_handler.send_notification
        )
        self.should_stop = False
    
    def setup_signal_handlers(self):
        """
        시그널 핸들러 설정 (Ctrl+C로 종료)
        """
        def signal_handler(sig, frame):
            print("\n\n종료 신호를 받았습니다. 폴러를 중지합니다...")
            self.should_stop = True
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def run_test(self, duration: int = None):
        """
        폴러 테스트 실행
        
        Args:
            duration: 테스트 실행 시간 (초), None이면 무한 실행
        """
        print("=" * 60)
        print("🚌 통학버스 예매 폴러 테스트 시작")
        print("=" * 60)
        print(f"체크 주기: {self.poller.check_interval}초")
        print(f"실행 시간: {'무한' if duration is None else f'{duration}초'}")
        print("종료하려면 Ctrl+C를 누르세요.")
        print("=" * 60)
        print()
        
        # 폴러 시작
        await self.poller.start()
        
        try:
            if duration:
                # 지정된 시간만큼 실행
                await asyncio.sleep(duration)
            else:
                # 무한 실행 (Ctrl+C로 종료)
                while not self.should_stop:
                    await asyncio.sleep(1)
                    
                    # 주기적으로 통계 출력 (60초마다)
                    if self.poller.check_count > 0 and self.poller.check_count % 2 == 0:
                        self.print_stats()
        
        except asyncio.CancelledError:
            print("\n테스트가 취소되었습니다.")
        
        finally:
            # 폴러 중지
            await self.poller.stop()
            
            # 최종 통계 출력
            print("\n" + "=" * 60)
            print("📊 최종 통계")
            print("=" * 60)
            self.print_stats()
            self.print_notification_history()
            print("\n테스트가 종료되었습니다.")
    
    def print_stats(self):
        """
        폴러 통계 출력
        """
        stats = self.poller.get_stats()
        print(f"\n📈 현재 통계:")
        print(f"  - 실행 상태: {'실행 중' if stats['is_running'] else '중지됨'}")
        print(f"  - 체크 횟수: {stats['check_count']}회")
        print(f"  - 체크 주기: {stats['check_interval']}초")
        if stats['last_status']:
            print(f"  - 마지막 체크: {stats['last_status'].get('timestamp', 'N/A')}")
            print(f"  - 예매 상태: {'오픈' if stats['last_status'].get('is_open') else '닫힘'}")
    
    def print_notification_history(self):
        """
        알림 히스토리 출력
        """
        history = self.notification_handler.get_notification_history()
        print(f"\n📬 알림 히스토리 ({len(history)}건):")
        
        if not history:
            print("  - 알림 없음")
        else:
            for i, notification in enumerate(history, 1):
                print(f"\n  [{i}] {notification['title']}")
                print(f"      시간: {notification['timestamp']}")
                print(f"      메시지: {notification['message']}")


async def main():
    """
    메인 함수
    """
    # 체크 주기 설정 (기본: 30초)
    check_interval = 30
    
    # 커맨드 라인 인자로 체크 주기 변경 가능
    if len(sys.argv) > 1:
        try:
            check_interval = int(sys.argv[1])
        except ValueError:
            print(f"경고: 잘못된 체크 주기 값입니다. 기본값 {check_interval}초를 사용합니다.")
    
    # 테스터 생성 및 실행
    tester = PollerTester(check_interval=check_interval)
    tester.setup_signal_handlers()
    
    # 테스트 실행 (무한 실행, Ctrl+C로 종료)
    await tester.run_test()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n프로그램이 종료되었습니다.")
    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()
