"""
カスタムミドルウェア
"""

import time
from typing import Dict, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.exceptions import RateLimitError
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """シンプルなレート制限実装（本番ではRedisを使用することを推奨）"""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, client_ip: str) -> bool:
        """リクエストが許可されるかチェック"""
        current_time = time.time()
        window_start = current_time - settings.rate_limit_window
        
        # クライアントのリクエスト履歴を取得
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # ウィンドウ外のリクエストを削除
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > window_start
        ]
        
        # リクエスト数をチェック
        if len(self.requests[client_ip]) >= settings.rate_limit_requests:
            return False
        
        # 新しいリクエストを記録
        self.requests[client_ip].append(current_time)
        return True
    
    def get_remaining_requests(self, client_ip: str) -> int:
        """残りリクエスト数を取得"""
        current_time = time.time()
        window_start = current_time - settings.rate_limit_window
        
        if client_ip not in self.requests:
            return settings.rate_limit_requests
        
        # ウィンドウ内のリクエスト数をカウント
        recent_requests = [
            req_time for req_time in self.requests[client_ip]
            if req_time > window_start
        ]
        
        return max(0, settings.rate_limit_requests - len(recent_requests))


# グローバルレート制限インスタンス
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """レート制限ミドルウェア"""
    # クライアントIPを取得
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    
    # レート制限チェック
    if not rate_limiter.is_allowed(client_ip):
        remaining = rate_limiter.get_remaining_requests(client_ip)
        
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "message": "リクエスト制限に達しました",
                "retry_after": settings.rate_limit_window,
                "remaining_requests": remaining
            },
            headers={
                "Retry-After": str(settings.rate_limit_window),
                "X-RateLimit-Limit": str(settings.rate_limit_requests),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(int(time.time() + settings.rate_limit_window))
            }
        )
    
    response = await call_next(request)
    
    # レスポンスヘッダーにレート制限情報を追加
    remaining = rate_limiter.get_remaining_requests(client_ip)
    response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_requests)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    
    return response


class SecurityHeadersMiddleware:
    """セキュリティヘッダーを追加するミドルウェア"""
    
    @staticmethod
    async def add_security_headers(request: Request, call_next):
        """セキュリティヘッダーを追加"""
        response = await call_next(request)
        
        # セキュリティヘッダーを追加
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # HTTPS環境でのみ追加
        if not settings.debug:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
