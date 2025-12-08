from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import router as api_router
import os

app = FastAPI(title="SchoolBus API", version="1.0.0")

# CORS 설정 (환경에 따라 동적 설정)
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = allowed_origins_str.split(",") if allowed_origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # 환경 변수로 제어
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
# Vercel에서는 이미 /api로 라우팅되므로 prefix 제거
app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "SchoolBus API Server"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
