"""
Supabase 클라이언트 초기화 및 설정 (Lazy initialization)
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 전역 변수
_supabase_client: Client = None

def get_supabase_client() -> Client:
    """
    Supabase 클라이언트 인스턴스 반환 (Lazy initialization)
    """
    global _supabase_client
    
    if _supabase_client is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_KEY = os.getenv("SUPABASE_KEY")
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    return _supabase_client

# 하위 호환성을 위한 Lazy 프록시
class _SupabaseLazyProxy:
    """Supabase 클라이언트 Lazy 프록시"""
    def __getattr__(self, name):
        return getattr(get_supabase_client(), name)
    
    def __call__(self, *args, **kwargs):
        return get_supabase_client()(*args, **kwargs)

supabase = _SupabaseLazyProxy()
