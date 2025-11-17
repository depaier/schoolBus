from fastapi import APIRouter
from .routes import example
from .routes import register      # 기존 너 코드 유지
from .routes import reservation   # 🔥 새로 추가 (내가 알려준 것)

router = APIRouter()

# 기존 예제 라우트
router.include_router(example.router, prefix="/example", tags=["example"])

# 사용자 등록 라우트 (네가 만든 것)
router.include_router(register.router, tags=["register"])

# 🔥 예매 상태 라우트 (이번 과제 위해 추가)
router.include_router(reservation.router, tags=["reservation"])
