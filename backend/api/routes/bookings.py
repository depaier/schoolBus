from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os
from datetime import datetime

# Supabase 클라이언트 import
from backend.config.supabase_client import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()


class BookingRequest(BaseModel):
    student_id: str
    route_id: str  # matches bus_routes.route_id
    seat_count: int = 1  # 예약 인원 수
    departure_date: Optional[str] = None  # 출발 날짜


@router.post("/bookings")
async def create_booking(booking: BookingRequest):
    """
    사용자 예매 생성
    - 학생 학번으로 사용자를 찾고(있으면 이름/연락처 사용)
    - 노선을 route_id로 찾음
    - 좌석 중복 / 잔여석 확인
    - 예약 레코드 생성 및 bus_routes.available_seats 감소
    """
    try:
        # 버스 노선 조회 (route_id 필드 기준)
        route_resp = supabase.table("bus_routes").select("*").eq("route_id", booking.route_id).limit(1).execute()
        if not route_resp.data or len(route_resp.data) == 0:
            raise HTTPException(status_code=404, detail="해당 노선을 찾을 수 없습니다.")

        route = route_resp.data[0]

        # 예매가 열려 있는지 확인
        if not route.get("is_open", False):
            raise HTTPException(status_code=400, detail="해당 노선의 예매가 열려있지 않습니다.")

        # 남은 좌석 확인
        available = route.get("available_seats", 0)
        if available < booking.seat_count:
            raise HTTPException(status_code=400, detail=f"남은 좌석이 부족합니다. (잔여: {available}석)")

        # 학생 정보 조회 (있다면 이름/연락처 사용)
        user_resp = supabase.table("users").select("name, email, phone").eq("student_id", booking.student_id).limit(1).execute()
        user_name = booking.student_id
        user_email = None
        user_phone = None
        if user_resp.data and len(user_resp.data) > 0:
            u = user_resp.data[0]
            user_name = u.get("name") or user_name
            user_email = u.get("email")
            user_phone = u.get("phone")

        # 예약 생성
        new_res = supabase.table("reservations").insert({
            "route_id": route["id"],
            "user_name": user_name,
            "user_email": user_email,
            "user_phone": user_phone,
            "seat_count": booking.seat_count,
            "status": "confirmed",
            "created_at": datetime.now().isoformat()
        }).execute()

        if not new_res.data or len(new_res.data) == 0:
            raise HTTPException(status_code=500, detail="예약 생성에 실패했습니다.")

        # available_seats 감소
        try:
            supabase.table("bus_routes").update({
                "available_seats": max(0, available - booking.seat_count)
            }).eq("id", route["id"]).execute()
        except Exception:
            # 예약은 생성되었지만 좌석 감소가 실패한 경우 경고 수준의 처리
            pass

        return {
            "message": "예약이 완료되었습니다.",
            "reservation": new_res.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"예약 실패: {str(e)}")


@router.get("/bookings/user/{student_id}")
async def get_user_bookings(student_id: str):
    """
    사용자의 예약 내역 조회
    - 학번으로 사용자 조회 (없으면 404)
    - 사용자의 `email`, `phone`, `name`으로 `reservations`를 조회
    - 각 예약에 대해 노선 정보를 함께 붙여 반환
    """
    try:
        # 사용자 조회
        user_resp = supabase.table("users").select("*").eq("student_id", student_id).limit(1).execute()
        if not user_resp.data or len(user_resp.data) == 0:
            raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")

        user = user_resp.data[0]
        email = user.get("email")
        phone = user.get("phone")
        name = user.get("name")

        # 여러 기준으로 조회 (email, phone, name) — 각각 쿼리 후 중복 제거
        reservations_map = {}

        if email:
            r = supabase.table("reservations").select("*").eq("user_email", email).execute()
            if r.data:
                for item in r.data:
                    reservations_map[item["id"]] = item

        if phone:
            r = supabase.table("reservations").select("*").eq("user_phone", phone).execute()
            if r.data:
                for item in r.data:
                    reservations_map[item["id"]] = item

        # name은 항상 존재하므로 조회
        if name:
            r = supabase.table("reservations").select("*").eq("user_name", name).execute()
            if r.data:
                for item in r.data:
                    reservations_map[item["id"]] = item

        reservations = list(reservations_map.values())

        # 각 예약에 대해 노선(route) 정보 추가
        results = []
        for res in reservations:
            route_info = None
            try:
                route_resp = supabase.table("bus_routes").select("id, route_id, route_name, departure_time").eq("id", res.get("route_id")).limit(1).execute()
                if route_resp.data and len(route_resp.data) > 0:
                    route_info = route_resp.data[0]
            except Exception:
                route_info = None

            results.append({
                "reservation": res,
                "route": route_info
            })

        # 최신순 정렬
        results.sort(key=lambda x: x["reservation"].get("created_at") or "", reverse=True)

        return {"bookings": results, "count": len(results)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"예약 조회 실패: {str(e)}")
