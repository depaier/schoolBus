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
from mangum import Mangum

# Vercel Serverless Function Handler
# Mangum을 사용하여 FastAPI를 AWS Lambda/Vercel 호환 핸들러로 변환
handler = Mangum(app, lifespan="off")
