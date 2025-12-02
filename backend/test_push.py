#!/usr/bin/env python3
"""
푸시 알림 테스트 스크립트
"""
import os
import sys
import json
import asyncio
from dotenv import load_dotenv
from config.supabase_client import supabase
from services.web_push_service import web_push_service

# .env 파일 로드
load_dotenv()

async def test_push():
    """푸시 알림 테스트"""
    print("=" * 60)
    print("푸시 알림 테스트 시작")
    print("=" * 60)
    
    # 1. VAPID 키 확인
    print("\n1️⃣ VAPID 키 확인")
    print(f"   Public Key: {web_push_service.vapid_public_key[:50]}...")
    print(f"   Private Key: {'✅ 로드됨' if web_push_service.vapid_private_key else '❌ 없음'}")
    
    if not web_push_service.vapid_private_key:
        print("\n❌ VAPID 개인 키가 없습니다!")
        print("   backend/.env 파일에 VAPID_PRIVATE_KEY_PEM을 설정하세요.")
        return False
    
    # 2. Supabase에서 구독 정보 조회
    print("\n2️⃣ Supabase에서 구독 정보 조회")
    try:
        response = supabase.table("users")\
            .select("student_id, name, push_subscription, notification_enabled")\
            .eq("notification_enabled", True)\
            .execute()
        
        if not response.data:
            print("   ❌ 알림이 활성화된 사용자가 없습니다")
            return False
        
        print(f"   ✅ {len(response.data)}명의 사용자 발견")
        
        for user in response.data:
            print(f"\n   사용자: {user.get('name')} ({user.get('student_id')})")
            print(f"   알림 활성화: {user.get('notification_enabled')}")
            
            if user.get('push_subscription'):
                subscription = user['push_subscription']
                if isinstance(subscription, str):
                    subscription = json.loads(subscription)
                
                endpoint = subscription.get('endpoint', '')
                print(f"   Endpoint: {endpoint[:60]}...")
                print(f"   p256dh: {subscription.get('keys', {}).get('p256dh', '')[:30]}...")
                print(f"   auth: {subscription.get('keys', {}).get('auth', '')[:20]}...")
                
                # 3. 푸시 알림 전송 테스트
                print(f"\n3️⃣ 푸시 알림 전송 테스트")
                success = await web_push_service.send_notification(
                    subscription,
                    "🧪 테스트 알림",
                    "푸시 알림 시스템이 정상적으로 작동하고 있습니다!",
                    {"test": "true"}
                )
                
                if success:
                    print(f"   ✅ {user.get('name')}님에게 푸시 알림 전송 성공!")
                else:
                    print(f"   ❌ {user.get('name')}님에게 푸시 알림 전송 실패")
            else:
                print("   ⚠️ push_subscription이 비어있습니다")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("\n🚀 푸시 알림 테스트 스크립트")
    print("=" * 60)
    
    result = asyncio.run(test_push())
    
    print("\n" + "=" * 60)
    if result:
        print("✅ 테스트 완료!")
    else:
        print("❌ 테스트 실패")
    print("=" * 60)
    
    sys.exit(0 if result else 1)
