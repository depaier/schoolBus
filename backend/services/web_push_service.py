"""Web Push 알림 서비스 - http_ece 직접 암호화 (iOS 호환)"""

import os
import json
import logging
import time
import base64
import requests
from typing import List, Dict, Any, Optional
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
from http_ece import encrypt

logger = logging.getLogger(__name__)

class WebPushService:
    def __init__(self):
        """Web Push 서비스 초기화"""
        self.vapid_private_key = None  # 키 객체 저장
        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY")
        self.vapid_claims = {
            "sub": "mailto:admin@schoolbus.com"  # 관리자 이메일
        }
        
        # 비공개키 로드
        private_key_pem = os.getenv("VAPID_PRIVATE_KEY_PEM")
        if private_key_pem:
            try:
                self.vapid_private_key = serialization.load_pem_private_key(
                    private_key_pem.encode('utf-8'),
                    password=None,
                    backend=default_backend()
                )
                logger.info("VAPID 키 로드 완료")
            except Exception as e:
                logger.error(f"VAPID 키 로드 실패: {e}")
        else:
            logger.warning("VAPID_PRIVATE_KEY_PEM 환경 변수가 설정되지 않았습니다")
    
    async def send_notification(
        self,
        subscription_info: Dict[str, Any],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> bool:
        """단일 구독자에게 푸시 알림 전송 - http_ece 직접 암호화"""
        try:
            endpoint = subscription_info.get('endpoint', '')
            p256dh = subscription_info.get('keys', {}).get('p256dh', '')
            auth = subscription_info.get('keys', {}).get('auth', '')
            
            if not all([endpoint, p256dh, auth]):
                logger.error("구독 정보가 불완전합니다")
                return False
            
            logger.info(f"📤 푸시 알림 전송 시도: {endpoint[:60]}...")
            
            if not self.vapid_private_key:
                logger.error("VAPID 개인 키가 없습니다")
                return False
            
            # 알림 페이로드 생성
            payload_dict = {
                "title": title,
                "body": body,
                "icon": "/vite.svg",
                "badge": "/vite.svg",
                "vibrate": [200, 100, 200],
                "data": data or {},
                "requireInteraction": True
            }
            payload = json.dumps(payload_dict, ensure_ascii=False).encode('utf-8')
            
            logger.info(f"📦 페이로드 크기: {len(payload)} bytes")
            
            # http_ece로 암호화 (임시 개인 키 생성)
            # 임시 EC 키 쌍 생성
            temp_private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
            
            encrypted = encrypt(
                payload,
                salt=None,
                private_key=temp_private_key,
                dh=base64.urlsafe_b64decode(p256dh + '=' * (4 - len(p256dh) % 4)),
                auth_secret=base64.urlsafe_b64decode(auth + '=' * (4 - len(auth) % 4)),
                version="aes128gcm"
            )
            
            # VAPID JWT 생성
            import urllib.parse
            parsed = urllib.parse.urlparse(endpoint)
            audience = f"{parsed.scheme}://{parsed.netloc}"
            
            payload_data = {
                "aud": audience,
                "exp": int(time.time()) + 86400,
                "sub": self.vapid_claims.get("sub", "mailto:admin@schoolbus.com")
            }
            
            header = {"alg": "ES256", "typ": "JWT"}
            header_b64 = base64.urlsafe_b64encode(
                json.dumps(header, separators=(',', ':')).encode()
            ).decode().rstrip('=')
            
            payload_b64 = base64.urlsafe_b64encode(
                json.dumps(payload_data, separators=(',', ':')).encode()
            ).decode().rstrip('=')
            
            message = f"{header_b64}.{payload_b64}".encode()
            signature = self.vapid_private_key.sign(message, ec.ECDSA(hashes.SHA256()))
            signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
            
            jwt_token = f"{header_b64}.{payload_b64}.{signature_b64}"
            
            # HTTP 헤더
            headers = {
                'TTL': '86400',
                'Content-Type': 'application/octet-stream',
                'Content-Encoding': 'aes128gcm',
                'Authorization': f'vapid t={jwt_token}, k={self.vapid_public_key}'
            }
            
            # HTTP 요청 전송
            response = requests.post(
                endpoint,
                data=encrypted,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"📡 HTTP 응답: {response.status_code}")
            
            if response.status_code in [200, 201, 202]:
                logger.info("✅ 푸시 알림 전송 성공")
                return True
            elif response.status_code in [400, 404, 410, 413]:
                logger.warning(f"⚠️ 클라이언트 오류 ({response.status_code})")
                logger.warning(f"응답: {response.text}")
                return False
            else:
                logger.error(f"⚠️ 서버 오류 ({response.status_code}): {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 푸시 알림 전송 실패: {e}")
            import traceback
            logger.error(f"상세 오류:\n{traceback.format_exc()}")
            return False
    
    async def send_to_multiple(
        self,
        subscriptions: List[Dict[str, Any]],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Dict[str, int]:
        """여러 구독자에게 푸시 알림 전송"""
        success_count = 0
        failure_count = 0
        expired_subscriptions = []
        
        for idx, subscription in enumerate(subscriptions):
            try:
                result = await self.send_notification(subscription, title, body, data)
                if result:
                    success_count += 1
                else:
                    failure_count += 1
                    # 만료된 구독 추적
                    expired_subscriptions.append(idx)
            except Exception as e:
                logger.error(f"구독 {idx} 전송 실패: {e}")
                failure_count += 1
        
        logger.info(f"멀티캐스트 완료: 성공 {success_count}, 실패 {failure_count}")
        
        return {
            "success_count": success_count,
            "failure_count": failure_count,
            "expired_subscriptions": expired_subscriptions
        }
    
    async def send_to_all_users(
        self,
        supabase_client,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """알림이 활성화된 모든 사용자에게 푸시 알림 전송"""
        try:
            # Supabase에서 알림 활성화된 사용자의 push subscription 조회
            response = supabase_client.table("users")\
                .select("student_id, push_subscription")\
                .eq("notification_enabled", True)\
                .execute()
            
            if not response.data:
                logger.warning("알림 활성화된 사용자가 없습니다")
                return {
                    "success_count": 0,
                    "failure_count": 0,
                    "message": "No users to notify"
                }
            
            # push_subscription 추출 (None이 아닌 것만)
            subscriptions = []
            user_ids = []
            
            for user in response.data:
                if user.get("push_subscription"):
                    try:
                        # JSON 문자열을 딕셔너리로 변환
                        if isinstance(user["push_subscription"], str):
                            subscription = json.loads(user["push_subscription"])
                        else:
                            subscription = user["push_subscription"]
                        
                        subscriptions.append(subscription)
                        user_ids.append(user["student_id"])
                    except json.JSONDecodeError as e:
                        logger.error(f"구독 정보 파싱 실패 ({user['student_id']}): {e}")
            
            if not subscriptions:
                logger.warning("유효한 push subscription이 없습니다")
                return {
                    "success_count": 0,
                    "failure_count": 0,
                    "message": "No valid subscriptions"
                }
            
            logger.info(f"{len(subscriptions)}명의 사용자에게 푸시 알림 전송 시도")
            
            # 멀티캐스트로 전송
            result = await self.send_to_multiple(subscriptions, title, body, data)
            
            # 만료된 구독 정보 정리
            if result.get("expired_subscriptions"):
                for idx in result["expired_subscriptions"]:
                    student_id = user_ids[idx]
                    try:
                        # 만료된 구독 정보 삭제
                        supabase_client.table("users")\
                            .update({"push_subscription": None})\
                            .eq("student_id", student_id)\
                            .execute()
                        logger.info(f"만료된 구독 정보 삭제: {student_id}")
                    except Exception as e:
                        logger.error(f"구독 정보 삭제 실패 ({student_id}): {e}")
            
            return result
            
        except Exception as e:
            logger.error(f"전체 사용자 알림 전송 실패: {e}")
            return {
                "success_count": 0,
                "failure_count": 0,
                "error": str(e)
            }


# 전역 인스턴스
web_push_service = WebPushService()
