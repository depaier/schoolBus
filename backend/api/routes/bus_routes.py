# api/routes/bus_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import time
import sys
import os
import logging

# Supabase 클라이언트 import
from backend.config.supabase_client import get_supabase_client
from backend.services.web_push_service import web_push_service

router = APIRouter()
supabase = get_supabase_client()
logger = logging.getLogger(__name__)

class BusRouteCreate(BaseModel):
    route_name: str
    route_id: str
    bus_type: str = "등교"  # "등교" 또는 "하교"
    departure_date: str  # "YYYY-MM-DD" 형식
    departure_time: str  # "HH:MM" 형식
    total_seats: int = 30

class BusRouteUpdate(BaseModel):
    route_name: Optional[str] = None
    bus_type: Optional[str] = None
    departure_date: Optional[str] = None
    departure_time: Optional[str] = None
    total_seats: Optional[int] = None
    available_seats: Optional[int] = None
    is_open: Optional[bool] = None

@router.get("/routes")
async def get_all_routes():
    """
    모든 버스 노선 조회
    """
    try:
        response = supabase.table("bus_routes").select("*").order("id").execute()
        return {
            "routes": response.data,
            "count": len(response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.get("/routes/{route_id}")
async def get_route(route_id: str):
    """
    특정 노선 조회
    """
    try:
        response = supabase.table("bus_routes").select("*").eq("route_id", route_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="노선을 찾을 수 없습니다.")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.post("/routes")
async def create_route(route: BusRouteCreate):
    """
    새 버스 노선 생성
    """
    try:
        new_route = supabase.table("bus_routes").insert({
            "route_name": route.route_name,
            "route_id": route.route_id,
            "bus_type": route.bus_type,
            "departure_date": route.departure_date,
            "departure_time": route.departure_time,
            "total_seats": route.total_seats,
            "available_seats": route.total_seats,
            "is_open": False
        }).execute()
        
        return {
            "message": "노선이 생성되었습니다.",
            "route": new_route.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.put("/routes/{route_id}")
async def update_route(route_id: str, route: BusRouteUpdate):
    """
    버스 노선 정보 업데이트
    """
    try:
        # 업데이트할 데이터만 딕셔너리로 구성
        update_data = {}
        if route.route_name is not None:
            update_data["route_name"] = route.route_name
        if route.bus_type is not None:
            update_data["bus_type"] = route.bus_type
        if route.departure_date is not None:
            update_data["departure_date"] = route.departure_date
        if route.departure_time is not None:
            update_data["departure_time"] = route.departure_time
        if route.total_seats is not None:
            update_data["total_seats"] = route.total_seats
        if route.available_seats is not None:
            update_data["available_seats"] = route.available_seats
        if route.is_open is not None:
            update_data["is_open"] = route.is_open
        
        if not update_data:
            raise HTTPException(status_code=400, detail="업데이트할 데이터가 없습니다.")
        
        updated = supabase.table("bus_routes").update(update_data).eq("route_id", route_id).execute()
        
        if not updated.data or len(updated.data) == 0:
            raise HTTPException(status_code=404, detail="노선을 찾을 수 없습니다.")
        
        return {
            "message": "노선이 업데이트되었습니다.",
            "route": updated.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.delete("/routes/{route_id}")
async def delete_route(route_id: str):
    """
    버스 노선 삭제
    """
    try:
        deleted = supabase.table("bus_routes").delete().eq("route_id", route_id).execute()
        
        if not deleted.data or len(deleted.data) == 0:
            raise HTTPException(status_code=404, detail="노선을 찾을 수 없습니다.")
        
        return {
            "message": "노선이 삭제되었습니다.",
            "route_id": route_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.post("/routes/{route_id}/toggle")
async def toggle_route_status(route_id: str):
    """
    특정 노선의 예매 오픈/닫기 토글
    """
    try:
        # 현재 상태 조회 (전체 정보 가져오기)
        response = supabase.table("bus_routes").select("*").eq("route_id", route_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="노선을 찾을 수 없습니다.")
        
        route_data = response.data[0]
        current_status = route_data["is_open"]
        new_status = not current_status
        
        # 상태 토글
        updated = supabase.table("bus_routes").update({
            "is_open": new_status
        }).eq("route_id", route_id).execute()
        
        # 🔥 닫혀있었는데 열린 경우 푸시 알림 전송
        push_result = None
        if not current_status and new_status:
            logger.info(f"노선 오픈 감지 - 푸시 알림 전송 시작: {route_id}")
            try:
                notification_data = {
                    "route_id": route_data["route_id"],
                    "route_name": route_data["route_name"],
                    "bus_type": route_data.get("bus_type", "등교"),
                    "departure_date": route_data.get("departure_date", ""),
                    "departure_time": route_data.get("departure_time", ""),
                    "action": "open_route"
                }
                notification_body = f"{notification_data['bus_type']} - {notification_data['route_name']} ({notification_data['departure_date']} {notification_data['departure_time']})"
                
                push_result = await web_push_service.send_to_all_users(
                    supabase,
                    "🎉 통학버스 예매 오픈!",
                    notification_body,
                    notification_data
                )
                logger.info(f"푸시 알림 전송 결과: {push_result}")
            except Exception as e:
                logger.error(f"푸시 알림 전송 실패: {e}")
                push_result = {"error": str(e)}
        
        response_data = {
            "message": f"노선이 {'오픈' if new_status else '닫힘'}되었습니다.",
            "route": updated.data[0]
        }
        
        # 푸시 알림 결과 포함
        if push_result is not None:
            response_data["push_notification"] = push_result
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")
