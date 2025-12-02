#!/usr/bin/env python3
"""
.env 파일의 VAPID 키를 올바른 형식으로 수정
"""
import re

# .env 파일 읽기
with open('.env', 'r') as f:
    content = f.read()

# VAPID_PRIVATE_KEY_PEM 찾기
pattern = r"VAPID_PRIVATE_KEY_PEM='([^']+)'"
match = re.search(pattern, content, re.DOTALL)

if match:
    old_key = match.group(1)
    # 줄바꿈을 \n으로 변환
    new_key = old_key.replace('\n', '\\n')
    
    # 교체
    new_content = content.replace(
        f"VAPID_PRIVATE_KEY_PEM='{old_key}'",
        f'VAPID_PRIVATE_KEY_PEM="{new_key}"'
    )
    
    # 저장
    with open('.env', 'w') as f:
        f.write(new_content)
    
    print("✅ .env 파일 수정 완료!")
    print(f"   키 길이: {len(new_key)} 문자")
    print(f"   \\n 개수: {new_key.count('\\n')}")
else:
    print("❌ VAPID_PRIVATE_KEY_PEM을 찾을 수 없습니다")
