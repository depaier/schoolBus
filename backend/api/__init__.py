from fastapi import APIRouter
from .routes import example
from .routes import register      # 기존 너 코드 유지
from .routes import reservation   # 🔥 예매 상태 라우트
from .routes import bus_routes    # 🔥 버스 노선 라우트
from .routes import users          # 🔥 회원 관리 라우트

router = APIRouter()

# 기존 예제 라우트
router.include_router(example.router, prefix="/example", tags=["example"])

# 사용자 등록 라우트 (네가 만든 것)
router.include_router(register.router, tags=["register"])

# 🔥 예매 상태 라우트
router.include_router(reservation.router, tags=["reservation"])

# 🔥 버스 노선 라우트
router.include_router(bus_routes.router, tags=["bus_routes"])

# 🔥 회원 관리 라우트
router.include_router(users.router, tags=["users"])
