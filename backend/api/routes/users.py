# api/routes/users.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os
import hashlib

# Supabase 클라이언트 import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.supabase_client import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

class UserLogin(BaseModel):
    student_id: str
    password: str

class UserRegister(BaseModel):
    student_id: str  # 학번
    name: str
    password: str  # 비밀번호 추가
    email: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    fcm_token: Optional[str] = None
    apn_token: Optional[str] = None
    notification_enabled: Optional[bool] = None

def hash_password(password: str) -> str:
    """
    비밀번호를 SHA-256으로 해싱
    """
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/users/login")
async def login_user(login_data: UserLogin):
    """
    로그인
    """
    try:
        # 학번으로 사용자 조회
        response = supabase.table("users").select("*").eq("student_id", login_data.student_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=401, detail="학번 또는 비밀번호가 일치하지 않습니다.")
        
        user = response.data[0]
        
        # 비밀번호 확인
        hashed_password = hash_password(login_data.password)
        if user.get("password") != hashed_password:
            raise HTTPException(status_code=401, detail="학번 또는 비밀번호가 일치하지 않습니다.")
        
        # 로그인 성공 - 사용자 정보 반환 (비밀번호 제외)
        return {
            "message": "로그인 성공",
            "user": {
                "id": user["id"],
                "student_id": user["student_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "notification_enabled": user["notification_enabled"],
                "created_at": user["created_at"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로그인 실패: {str(e)}")

@router.post("/users/register")
async def register_user(user: UserRegister):
    """
    회원가입
    """
    try:
        # 학번 중복 체크 (더 자세한 로깅)
        print(f"[DEBUG] 회원가입 시도 - 학번: {user.student_id}")
        existing = supabase.table("users").select("*").eq("student_id", user.student_id).execute()
        
        print(f"[DEBUG] 기존 사용자 조회 결과: {existing.data}")
        
        if existing.data and len(existing.data) > 0:
            print(f"[DEBUG] 중복된 학번 발견: {existing.data}")
            raise HTTPException(status_code=400, detail=f"이미 등록된 학번입니다. (ID: {existing.data[0].get('id')})")
        
        # 비밀번호 해싱
        hashed_password = hash_password(user.password)
        
        # 회원 생성
        print(f"[DEBUG] 새 사용자 생성 시도...")
        new_user = supabase.table("users").insert({
            "student_id": user.student_id,
            "name": user.name,
            "password": hashed_password,
            "email": user.email,
            "phone": user.phone,
            "notification_enabled": True
        }).execute()
        
        print(f"[DEBUG] 회원가입 성공: {new_user.data}")
        
        return {
            "message": "회원가입이 완료되었습니다.",
            "user": {
                "id": new_user.data[0]["id"],
                "student_id": new_user.data[0]["student_id"],
                "name": new_user.data[0]["name"],
                "email": new_user.data[0]["email"],
                "phone": new_user.data[0]["phone"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 회원가입 실패: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"회원가입 실패: {str(e)}")

@router.get("/users/{student_id}")
async def get_user(student_id: str):
    """
    학번으로 회원 정보 조회
    """
    try:
        response = supabase.table("users").select("*").eq("student_id", student_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
        
        user = response.data[0]
        # 민감한 정보는 제외하고 반환
        return {
            "id": user["id"],
            "student_id": user["student_id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user["phone"],
            "notification_enabled": user["notification_enabled"],
            "created_at": user["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")

@router.put("/users/{student_id}")
async def update_user(student_id: str, user_update: UserUpdate):
    """
    회원 정보 업데이트
    """
    try:
        # 업데이트할 데이터만 딕셔너리로 구성
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.email is not None:
            update_data["email"] = user_update.email
        if user_update.phone is not None:
            update_data["phone"] = user_update.phone
        if user_update.fcm_token is not None:
            update_data["fcm_token"] = user_update.fcm_token
        if user_update.apn_token is not None:
            update_data["apn_token"] = user_update.apn_token
        if user_update.notification_enabled is not None:
            update_data["notification_enabled"] = user_update.notification_enabled
        
        if not update_data:
            raise HTTPException(status_code=400, detail="업데이트할 데이터가 없습니다.")
        
        updated = supabase.table("users").update(update_data).eq("student_id", student_id).execute()
        
        if not updated.data or len(updated.data) == 0:
            raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
        
        return {
            "message": "회원 정보가 업데이트되었습니다.",
            "user": {
                "id": updated.data[0]["id"],
                "student_id": updated.data[0]["student_id"],
                "name": updated.data[0]["name"],
                "email": updated.data[0]["email"],
                "phone": updated.data[0]["phone"],
                "notification_enabled": updated.data[0]["notification_enabled"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"업데이트 실패: {str(e)}")

@router.post("/users/{student_id}/token")
async def update_push_token(student_id: str, fcm_token: Optional[str] = None, apn_token: Optional[str] = None):
    """
    푸시 알림 토큰 업데이트 (FCM 또는 APN)
    """
    try:
        update_data = {}
        if fcm_token:
            update_data["fcm_token"] = fcm_token
        if apn_token:
            update_data["apn_token"] = apn_token
        
        if not update_data:
            raise HTTPException(status_code=400, detail="토큰 정보가 없습니다.")
        
        updated = supabase.table("users").update(update_data).eq("student_id", student_id).execute()
        
        if not updated.data or len(updated.data) == 0:
            raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
        
        return {
            "message": "푸시 토큰이 업데이트되었습니다.",
            "student_id": student_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"토큰 업데이트 실패: {str(e)}")

@router.get("/users")
async def get_all_users():
    """
    모든 회원 조회 (관리자용)
    """
    try:
        response = supabase.table("users").select("id, student_id, name, email, phone, notification_enabled, created_at").order("created_at", desc=True).execute()
        
        return {
            "users": response.data,
            "count": len(response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")

@router.get("/users/notifications/enabled")
async def get_notification_enabled_users():
    """
    알림이 활성화된 회원 목록 조회 (푸시 알림 전송용)
    """
    try:
        response = supabase.table("users").select("*").eq("notification_enabled", True).execute()
        
        # FCM 또는 APN 토큰이 있는 사용자만 필터링
        users_with_tokens = [
            user for user in response.data 
            if user.get("fcm_token") or user.get("apn_token")
        ]
        
        return {
            "users": users_with_tokens,
            "count": len(users_with_tokens)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")
