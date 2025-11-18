"""
비동기 폴러 서비스
통학버스 예매 오픈 여부를 주기적으로 체크
"""
import asyncio
from datetime import datetime
from typing import Optional, Callable, Dict, Any
import logging

# 🔥 Supabase 클라이언트 import
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.supabase_client import get_supabase_client

supabase = get_supabase_client()  

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BusReservationPoller:
    """
    통학버스 예매 오픈 상태를 주기적으로 체크하는 비동기 폴러
    """
    
    def __init__(
        self,
        check_interval: int = 30,
        notification_callback: Optional[Callable] = None
    ):
        """
        Args:
            check_interval: 체크 주기 (초 단위, 기본값: 30초)
            notification_callback: 예매가 열렸을 때 호출할 콜백 함수
        """
        self.check_interval = check_interval
        self.notification_callback = notification_callback
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.check_count = 0
        self.last_status: Dict[str, Any] = {}
        
    async def check_reservation_status(self) -> Dict[str, Any]:
        """
        예매 오픈 상태를 체크하는 메서드 (Supabase에서 조회)
        
        Returns:
            예매 상태 정보 딕셔너리
        """
        self.check_count += 1
        
        try:
            # 🔥 Supabase에서 예매 상태 조회
            response = supabase.table("reservation_status").select("*").limit(1).execute()
            
            if response.data and len(response.data) > 0:
                is_open = response.data[0]["is_open"]
            else:
                is_open = False
                logger.warning("예매 상태 레코드가 없습니다. 기본값(False) 사용")
            
            # 오픈된 노선 정보 조회 (선택사항)
            routes_response = supabase.table("bus_routes").select("*").eq("is_open", True).execute()
            
            route_info = {
                "route_id": "ROUTE_001",
                "route_name": "등교 노선 A",
                "available_seats": 15 if is_open else 0,
                "departure_time": "08:00",
            }
            
            # 실제 오픈된 노선이 있으면 첫 번째 노선 정보 사용
            if routes_response.data and len(routes_response.data) > 0:
                first_route = routes_response.data[0]
                route_info = {
                    "route_id": first_route["route_id"],
                    "route_name": first_route["route_name"],
                    "available_seats": first_route["available_seats"],
                    "departure_time": str(first_route["departure_time"]),
                }
            
            status = {
                "timestamp": datetime.now().isoformat(),
                "is_open": is_open,
                "check_count": self.check_count,
                "route_info": route_info
            }
            
            logger.info(f"체크 #{self.check_count} - 예매 오픈 상태: {is_open}")
            
            return status
            
        except Exception as e:
            logger.error(f"Supabase 조회 중 오류: {e}")
            # 오류 발생 시 기본값 반환
            return {
                "timestamp": datetime.now().isoformat(),
                "is_open": False,
                "check_count": self.check_count,
                "route_info": {
                    "route_id": "ERROR",
                    "route_name": "오류",
                    "available_seats": 0,
                    "departure_time": "00:00",
                }
            }
    
    async def _poll_loop(self):
        """
        폴링 루프 - 주기적으로 예매 상태를 체크
        """
        logger.info(f"폴러 시작 - {self.check_interval}초마다 체크")
        
        while self.is_running:
            try:
                # 예매 상태 체크
                current_status = await self.check_reservation_status()
                
                # 상태 변경 감지 (이전에 닫혀있었는데 지금 열린 경우)
                if (
                    current_status["is_open"] and 
                    not self.last_status.get("is_open", False)
                ):
                    logger.info("🎉 예매가 열렸습니다!")
                    
                    # 알림 콜백 실행
                    if self.notification_callback:
                        await self._execute_callback(current_status)
                
                self.last_status = current_status
                
                # 다음 체크까지 대기
                await asyncio.sleep(self.check_interval)
                
            except asyncio.CancelledError:
                logger.info("폴러가 취소되었습니다.")
                break
            except Exception as e:
                logger.error(f"폴링 중 오류 발생: {e}", exc_info=True)
                await asyncio.sleep(self.check_interval)
    
    async def _execute_callback(self, status: Dict[str, Any]):
        """
        알림 콜백 실행
        """
        try:
            if asyncio.iscoroutinefunction(self.notification_callback):
                await self.notification_callback(status)
            else:
                self.notification_callback(status)
        except Exception as e:
            logger.error(f"콜백 실행 중 오류: {e}", exc_info=True)
    
    async def start(self):
        """
        폴러 시작
        """
        if self.is_running:
            logger.warning("폴러가 이미 실행 중입니다.")
            return
        
        self.is_running = True
        self.check_count = 0
        self.last_status = {}
        self.task = asyncio.create_task(self._poll_loop())
        logger.info("폴러가 시작되었습니다.")
    
    async def stop(self):
        """
        폴러 중지
        """
        if not self.is_running:
            logger.warning("폴러가 실행 중이 아닙니다.")
            return
        
        self.is_running = False
        
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        logger.info("폴러가 중지되었습니다.")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        폴러 통계 정보 반환
        """
        return {
            "is_running": self.is_running,
            "check_count": self.check_count,
            "check_interval": self.check_interval,
            "last_status": self.last_status,
        }
