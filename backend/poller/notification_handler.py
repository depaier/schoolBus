"""
알림 핸들러
예매 오픈 시 사용자에게 알림을 전송
"""
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class NotificationHandler:
    """
    예매 오픈 알림을 처리하는 핸들러
    """
    
    def __init__(self):
        self.notification_history: List[Dict[str, Any]] = []
    
    async def send_notification(self, status: Dict[str, Any]):
        """
        알림 전송 (현재는 로그로만 출력, 추후 실제 알림 시스템 연동)
        
        Args:
            status: 예매 상태 정보
        """
        route_info = status.get("route_info", {})
        
        notification_data = {
            "timestamp": datetime.now().isoformat(),
            "title": "통학버스 예매 오픈!",
            "message": self._create_notification_message(route_info),
            "status": status,
        }
        
        # 알림 히스토리에 저장
        self.notification_history.append(notification_data)
        
        # 로그 출력
        logger.info("=" * 60)
        logger.info(f"📢 {notification_data['title']}")
        logger.info(f"메시지: {notification_data['message']}")
        logger.info(f"노선: {route_info.get('route_name', 'N/A')}")
        logger.info(f"출발 시간: {route_info.get('departure_time', 'N/A')}")
        logger.info(f"남은 좌석: {route_info.get('available_seats', 0)}석")
        logger.info("=" * 60)
        
        # TODO: 실제 알림 전송 로직 구현
        # - 이메일 전송
        # - 푸시 알림
        # - SMS 전송
        # - 웹소켓을 통한 실시간 알림
        
        return notification_data
    
    def _create_notification_message(self, route_info: Dict[str, Any]) -> str:
        """
        알림 메시지 생성
        """
        route_name = route_info.get("route_name", "통학버스")
        available_seats = route_info.get("available_seats", 0)
        departure_time = route_info.get("departure_time", "")
        
        message = (
            f"{route_name} 예매가 오픈되었습니다! "
            f"출발시간: {departure_time}, "
            f"남은 좌석: {available_seats}석"
        )
        
        return message
    
    def get_notification_history(self) -> List[Dict[str, Any]]:
        """
        알림 히스토리 조회
        """
        return self.notification_history
    
    def clear_history(self):
        """
        알림 히스토리 초기화
        """
        self.notification_history.clear()
        logger.info("알림 히스토리가 초기화되었습니다.")
