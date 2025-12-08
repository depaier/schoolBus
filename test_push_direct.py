#!/usr/bin/env python3
"""
직접 Apple Push Service로 푸시 알림을 전송하는 테스트 스크립트
"""

import os
import json
import base64
import time
import requests
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
from http_ece import encrypt

# 환경 변수 로드
from dotenv import load_dotenv
load_dotenv('backend/.env')

# 구독 정보
SUBSCRIPTION = {
    "endpoint": "https://web.push.apple.com/QMEGi63JXFOWaudKLdpWuip4sM4zD1Y6rU0lN1j1qnN-MYrFWY2iFLlnVkyv1e5Os12NXoF2VJlYOVzl3xLzX4CdNyE-lHBxNbdReSq98-EWpzQnJ_OBgK4DQ5jLR5bnKe8j5Vx3EbOAULWoLYRSQgh7AHOBBQdDxCimVaXB3DY",
    "keys": {
        "p256dh": "BM3_Ie-ZUeI4Wy2__7GFTtmDPMGjuIxCnbYCdoFNVZ8EaKSlKXF6EoNCK-uQ9RYsW0gaUehewaIPdz2OVtcLEKA",
        "auth": "EKGO44DpF3mPHlWd1jpLHg"
    }
}

# VAPID 키
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY_PEM = os.getenv("VAPID_PRIVATE_KEY_PEM")

print("=" * 80)
print("🔧 Apple Push Service 직접 테스트")
print("=" * 80)

# VAPID 키 로드
print("\n1️⃣ VAPID 키 로드 중...")
if '\\n' in VAPID_PRIVATE_KEY_PEM:
    VAPID_PRIVATE_KEY_PEM = VAPID_PRIVATE_KEY_PEM.replace('\\n', '\n')

vapid_private_key = serialization.load_pem_private_key(
    VAPID_PRIVATE_KEY_PEM.encode('utf-8'),
    password=None,
    backend=default_backend()
)
print("✅ VAPID 키 로드 완료")
print(f"   Public Key: {VAPID_PUBLIC_KEY[:50]}...")

# 페이로드 생성
print("\n2️⃣ 페이로드 생성 중...")
payload_data = {
    "title": "🧪 테스트 알림",
    "body": "로컬에서 직접 전송한 테스트 알림입니다!",
    "icon": "/vite.svg",
    "tag": "test-" + str(int(time.time())),
    "data": {
        "timestamp": int(time.time())
    }
}
payload = json.dumps(payload_data).encode('utf-8')
print(f"✅ 페이로드 생성 완료 ({len(payload)} bytes)")
print(f"   내용: {payload_data['title']} - {payload_data['body']}")

# 암호화
print("\n3️⃣ 페이로드 암호화 중...")
endpoint = SUBSCRIPTION["endpoint"]
p256dh = SUBSCRIPTION["keys"]["p256dh"]
auth = SUBSCRIPTION["keys"]["auth"]

temp_private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())

encrypted = encrypt(
    payload,
    salt=None,
    private_key=temp_private_key,
    dh=base64.urlsafe_b64decode(p256dh + '=' * (4 - len(p256dh) % 4)),
    auth_secret=base64.urlsafe_b64decode(auth + '=' * (4 - len(auth) % 4)),
    version="aes128gcm"
)
print(f"✅ 암호화 완료 ({len(encrypted)} bytes)")

# VAPID JWT 생성
print("\n4️⃣ VAPID JWT 생성 중...")
import urllib.parse
parsed = urllib.parse.urlparse(endpoint)
audience = f"{parsed.scheme}://{parsed.netloc}"

payload_jwt = {
    "aud": audience,
    "exp": int(time.time()) + 86400,
    "sub": "mailto:admin@schoolbus.com"
}

header = {"alg": "ES256", "typ": "JWT"}
header_b64 = base64.urlsafe_b64encode(
    json.dumps(header, separators=(',', ':')).encode()
).decode().rstrip('=')

payload_b64 = base64.urlsafe_b64encode(
    json.dumps(payload_jwt, separators=(',', ':')).encode()
).decode().rstrip('=')

message = f"{header_b64}.{payload_b64}".encode()
signature = vapid_private_key.sign(message, ec.ECDSA(hashes.SHA256()))
signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

jwt_token = f"{header_b64}.{payload_b64}.{signature_b64}"
print(f"✅ JWT 생성 완료")
print(f"   Audience: {audience}")
print(f"   JWT: {jwt_token[:50]}...")

# HTTP 헤더
print("\n5️⃣ HTTP 요청 준비 중...")
headers = {
    'TTL': '86400',
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'Authorization': f'vapid t={jwt_token}, k={VAPID_PUBLIC_KEY}'
}

print("   Headers:")
for key, value in headers.items():
    if key == 'Authorization':
        print(f"     {key}: {value[:80]}...")
    else:
        print(f"     {key}: {value}")

# 전송
print("\n6️⃣ Apple Push Service로 전송 중...")
print(f"   Endpoint: {endpoint[:80]}...")

try:
    response = requests.post(
        endpoint,
        data=encrypted,
        headers=headers,
        timeout=10
    )
    
    print(f"\n✅ HTTP 응답: {response.status_code}")
    print(f"   Response Headers: {dict(response.headers)}")
    
    if response.text:
        print(f"   Response Body: {response.text}")
    
    if response.status_code in [200, 201, 202]:
        print("\n🎉 푸시 알림 전송 성공!")
        print("   iPhone에서 알림이 도착했는지 확인하세요.")
    else:
        print(f"\n❌ 전송 실패: {response.status_code}")
        print(f"   상세: {response.text}")
        
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    import traceback
    print(traceback.format_exc())

print("\n" + "=" * 80)
print("테스트 완료")
print("=" * 80)
