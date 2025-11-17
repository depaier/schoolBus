# api/routes/reservation.py
from fastapi import APIRouter
from pydantic import BaseModel
from reservation_state import reservation_state, set_reservation

router = APIRouter()

class ReservationUpdate(BaseModel):
    is_open: bool

@router.get("/reservation/status")
async def get_reservation_status():
    """
    현재 예매 상태 조회
    """
    return reservation_state

@router.post("/reservation/update")
async def update_reservation_status(body: ReservationUpdate):
    """
    예매 상태 변경 (열림/닫힘)
    """
    state = set_reservation(body.is_open)
    return {
        "message": "예매 상태가 변경되었습니다.",
        "state": state,
    }
