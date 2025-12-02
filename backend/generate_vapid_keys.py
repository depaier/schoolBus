#!/usr/bin/env python3
"""VAPID 키 생성 스크립트"""

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import base64

def generate_vapid_keys():
    """VAPID 공개키/비공개키 쌍 생성"""
    
    # EC 키 생성 (SECP256R1 곡선 사용)
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    
    # 비공개키를 PEM 형식으로 직렬화
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # 공개키 추출
    public_key = private_key.public_key()
    
    # 공개키를 uncompressed point 형식으로 직렬화
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    # URL-safe base64 인코딩 (패딩 제거)
    public_key_b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')
    
    print("=" * 80)
    print("VAPID 키 생성 완료!")
    print("=" * 80)
    print("\n다음 내용을 backend/.env 파일에 추가하세요:\n")
    print(f"VAPID_PUBLIC_KEY={public_key_b64}")
    print(f"VAPID_PRIVATE_KEY_PEM='{private_pem.decode('utf-8')}'")
    print("\n" + "=" * 80)
    print("\n다음 내용을 frontend/.env 파일에 추가하세요:\n")
    print(f"VITE_VAPID_PUBLIC_KEY={public_key_b64}")
    print("\n" + "=" * 80)
    
    return public_key_b64, private_pem.decode('utf-8')

if __name__ == "__main__":
    generate_vapid_keys()
