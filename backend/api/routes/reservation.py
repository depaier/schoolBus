# api/routes/reservation.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import logging
from backend.config.supabase_client import supabase
from backend.services.web_push_service import web_push_service

router = APIRouter()
logger = logging.getLogger(__name__)

class ReservationUpdate(BaseModel):
    is_open: bool

@router.get("/reservation/status")
async def get_reservation_status():
    """
    현재 예매 상태 조회 (Supabase)
    """
    try:
        # reservation_status 테이블에서 첫 번째 레코드 조회
        response = supabase.table("reservation_status").select("*").limit(1).execute()
        
        if response.data and len(response.data) > 0:
            status = response.data[0]
            return {
                "is_open": status["is_open"],
                "updated_at": status["updated_at"]
            }
        else:
            # 레코드가 없으면 생성
            new_status = supabase.table("reservation_status").insert({
                "is_open": False
            }).execute()
            
            return {
                "is_open": False,
                "updated_at": new_status.data[0]["updated_at"]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.post("/reservation/update")
async def update_reservation_status(body: ReservationUpdate):
    """
    예매 상태 변경 (열림/닫힘) - Supabase
    """
    try:
        # 첫 번째 레코드 조회 (이전 상태 확인용)
        response = supabase.table("reservation_status").select("id, is_open").limit(1).execute()
        
        if response.data and len(response.data) > 0:
            # 이전 상태 저장
            previous_status = response.data[0]["is_open"]
            
            # 기존 레코드 업데이트
            status_id = response.data[0]["id"]
            updated = supabase.table("reservation_status").update({
                "is_open": body.is_open,
                "updated_at": datetime.now().isoformat()
            }).eq("id", status_id).execute()
            
            # 🔥 닫혀있었는데 열린 경우 푸시 알림 전송
            if not previous_status and body.is_open:
                logger.info("예매 오픈 감지 - 푸시 알림 전송 시작")
                try:
                    result = await web_push_service.send_to_all_users(
                        supabase,
                        "🎉 통학버스 예매 오픈!",
                        "통학버스 예매가 오픈되었습니다. 지금 바로 예매하세요!"
                    )
                    logger.info(f"푸시 알림 전송 결과: {result}")
                except Exception as e:
                    logger.error(f"푸시 알림 전송 실패: {e}")
                    # 알림 실패해도 상태 업데이트는 성공으로 처리
            
            return {
                "message": "예매 상태가 변경되었습니다.",
                "state": {
                    "is_open": body.is_open,
                    "updated_at": updated.data[0]["updated_at"]
                }
            }
        else:
            # 레코드가 없으면 생성
            new_status = supabase.table("reservation_status").insert({
                "is_open": body.is_open
            }).execute()
            
            return {
                "message": "예매 상태가 생성되었습니다.",
                "state": {
                    "is_open": body.is_open,
                    "updated_at": new_status.data[0]["updated_at"]
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")
