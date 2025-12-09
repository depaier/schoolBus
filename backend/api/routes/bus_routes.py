# api/routes/bus_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import time
import sys
import os

# Supabase 클라이언트 import
from backend.config.supabase_client import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

class BusRouteCreate(BaseModel):
    route_name: str
    route_id: str
    bus_type: str = "등교"  # "등교" 또는 "하교"
    departure_time: str  # "HH:MM" 형식
    total_seats: int = 30

class BusRouteUpdate(BaseModel):
    route_name: Optional[str] = None
    bus_type: Optional[str] = None
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
        response = supabase.table("bus_routes").select("*").order("created_at").execute()
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
        # 현재 상태 조회
        response = supabase.table("bus_routes").select("is_open").eq("route_id", route_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="노선을 찾을 수 없습니다.")
        
        current_status = response.data[0]["is_open"]
        new_status = not current_status
        
        # 상태 토글
        updated = supabase.table("bus_routes").update({
            "is_open": new_status
        }).eq("route_id", route_id).execute()
        
        return {
            "message": f"노선이 {'오픈' if new_status else '닫힘'}되었습니다.",
            "route": updated.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")
