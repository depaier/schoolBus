# api/routes/reservation.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import sys
import os

# Supabase 클라이언트 import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.supabase_client import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

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
        # 첫 번째 레코드 조회
        response = supabase.table("reservation_status").select("id").limit(1).execute()
        
        if response.data and len(response.data) > 0:
            # 기존 레코드 업데이트
            status_id = response.data[0]["id"]
            updated = supabase.table("reservation_status").update({
                "is_open": body.is_open,
                "updated_at": datetime.now().isoformat()
            }).eq("id", status_id).execute()
            
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
