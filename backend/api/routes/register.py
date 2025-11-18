from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

# 메모리 저장소 (임시)
users: List[Dict] = []


# 요청 스키마
class RegisterRequest(BaseModel):
    username: str
    email: str
    age: int


@router.post("/register")
async def register_user(req: RegisterRequest):
    """
    사용자 등록 API
    요청 받은 데이터를 메모리 저장소(users 리스트)에 저장
    """

    user_data = {
        "id": len(users) + 1,
        "username": req.username,
        "email": req.email,
        "age": req.age,
    }

    users.append(user_data)

    return {
        "message": "사용자 등록 완료",
        "user": user_data
    }


@router.get("/register/all")
async def get_all_users():
    """저장된 모든 사용자 조회"""
    return {"users": users}
