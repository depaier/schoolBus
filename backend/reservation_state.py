# reservation_state.py
from datetime import datetime

# 전역 예매 상태 (메모리에 저장)
reservation_state = {
    "is_open": False,                # 예매 오픈 여부
    "updated_at": None,              # 마지막으로 바뀐 시간
}

def set_reservation(open_flag: bool):
    """예매 상태 변경 함수"""
    reservation_state["is_open"] = open_flag
    reservation_state["updated_at"] = datetime.now().isoformat()
    return reservation_state
