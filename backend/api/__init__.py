from fastapi import APIRouter
from .routes import example

router = APIRouter()

# 라우터 등록
router.include_router(example.router, prefix="/example", tags=["example"])
