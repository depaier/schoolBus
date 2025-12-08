"""
Vercel Serverless Function Entry Point for FastAPI Backend
"""
import sys
import os
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
root_path = Path(__file__).parent.parent
sys.path.insert(0, str(root_path))

# FastAPI 앱 임포트
from backend.main import app

# Vercel은 app 객체를 직접 사용
# ASGI 서버가 자동으로 처리
app = app
