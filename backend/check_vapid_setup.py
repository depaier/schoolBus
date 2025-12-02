#!/usr/bin/env python3
"""VAPID 설정 확인 스크립트"""

import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

print("=" * 80)
print("VAPID 설정 확인")
print("=" * 80)

# VAPID 공개키 확인
public_key = os.getenv("VAPID_PUBLIC_KEY")
if public_key:
    print(f"✅ VAPID_PUBLIC_KEY: {public_key[:50]}...")
else:
    print("❌ VAPID_PUBLIC_KEY: 설정되지 않음")
    print("\n해결 방법:")
    print("1. python generate_vapid_keys.py 실행")
    print("2. 출력된 키를 backend/.env 파일에 추가")

# VAPID 비공개키 확인
private_key = os.getenv("VAPID_PRIVATE_KEY_PEM")
if private_key:
    print(f"✅ VAPID_PRIVATE_KEY_PEM: 설정됨 ({len(private_key)} 문자)")
    if "BEGIN PRIVATE KEY" in private_key:
        print("   형식: PEM ✓")
    else:
        print("   ⚠️ 형식이 올바르지 않을 수 있습니다")
else:
    print("❌ VAPID_PRIVATE_KEY_PEM: 설정되지 않음")

print("=" * 80)

# Supabase 설정도 확인
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if supabase_url and supabase_key:
    print("✅ Supabase 설정: OK")
else:
    print("❌ Supabase 설정: 확인 필요")

print("=" * 80)

# 최종 판정
if public_key and private_key and supabase_url and supabase_key:
    print("\n🎉 모든 설정이 완료되었습니다!")
    print("\n다음 단계:")
    print("1. uvicorn main:app --reload 로 백엔드 시작")
    print("2. 프론트엔드에서 알림 활성화 테스트")
else:
    print("\n⚠️ 설정이 완료되지 않았습니다.")
    print("WEB_PUSH_SETUP.md 파일을 참고하세요.")

print("=" * 80)
