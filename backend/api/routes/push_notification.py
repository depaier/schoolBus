"""푸시 알림 API 라우트"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import json

from backend.config.supabase_client import supabase
from backend.services.web_push_service import web_push_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/push/debug/{student_id}")
async def debug_push_subscription(student_id: str):
    """특정 학생의 푸시 구독 정보 확인 (디버그용)"""
    try:
        response = supabase.table("users").select("student_id, push_subscription, notification_enabled").eq("student_id", student_id).execute()
        
        if response.data and len(response.data) > 0:
            user = response.data[0]
            subscription = user.get("push_subscription")
            
            debug_info = {
                "student_id": student_id,
                "notification_enabled": user.get("notification_enabled"),
                "has_subscription": subscription is not None,
            }
            
            if subscription:
                import json
                sub_data = json.loads(subscription) if isinstance(subscription, str) else subscription
                debug_info["endpoint"] = sub_data.get("endpoint", "")[:100] + "..."
                debug_info["endpoint_type"] = "Apple" if "apple.com" in sub_data.get("endpoint", "") else "Other"
                
            return debug_info
        else:
            return {"error": "사용자를 찾을 수 없습니다"}
    except Exception as e:
        logger.error(f"디버그 정보 조회 실패: {e}")
        return {"error": str(e)}


class PushSubscription(BaseModel):
    """푸시 구독 정보"""
    student_id: str
    subscription: Dict[str, Any]  # PushSubscription 객체


class TestNotification(BaseModel):
    """테스트 알림"""
    student_id: str
    title: str
    body: str


@router.post("/push/subscribe")
async def subscribe_push_notification(data: PushSubscription):
    """푸시 알림 구독 등록"""
    try:
        # 사용자 정보 업데이트
        response = supabase.table("users").update({
            "push_subscription": json.dumps(data.subscription),
            "notification_enabled": True
        }).eq("student_id", data.student_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        logger.info(f"푸시 구독 등록 완료: {data.student_id}")
        
        return {
            "message": "푸시 알림 구독이 등록되었습니다",
            "student_id": data.student_id
        }
        
    except Exception as e:
        logger.error(f"푸시 구독 등록 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push/unsubscribe")
async def unsubscribe_push_notification(student_id: str):
    """푸시 알림 구독 해제"""
    try:
        response = supabase.table("users").update({
            "push_subscription": None,
            "notification_enabled": False
        }).eq("student_id", student_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        logger.info(f"푸시 구독 해제 완료: {student_id}")
        
        return {
            "message": "푸시 알림 구독이 해제되었습니다",
            "student_id": student_id
        }
        
    except Exception as e:
        logger.error(f"푸시 구독 해제 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push/test")
async def send_test_notification(data: TestNotification):
    """테스트 푸시 알림 전송"""
    try:
        # 사용자의 구독 정보 조회
        response = supabase.table("users")\
            .select("push_subscription")\
            .eq("student_id", data.student_id)\
            .execute()
        
        if not response.data or not response.data[0].get("push_subscription"):
            raise HTTPException(
                status_code=404,
                detail="푸시 구독 정보를 찾을 수 없습니다"
            )
        
        # 구독 정보 파싱
        subscription_str = response.data[0]["push_subscription"]
        if isinstance(subscription_str, str):
            subscription = json.loads(subscription_str)
        else:
            subscription = subscription_str
        
        # 푸시 알림 전송
        result = await web_push_service.send_notification(
            subscription,
            data.title,
            data.body
        )
        
        if result:
            return {
                "message": "테스트 알림이 전송되었습니다",
                "student_id": data.student_id
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="푸시 알림 전송에 실패했습니다"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"테스트 알림 전송 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """VAPID 공개키 조회"""
    import os
    
    public_key = os.getenv("VAPID_PUBLIC_KEY")
    
    if not public_key:
        raise HTTPException(
            status_code=500,
            detail="VAPID 공개키가 설정되지 않았습니다"
        )
    
    return {"publicKey": public_key}
