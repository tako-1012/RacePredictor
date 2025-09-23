#!/usr/bin/env python3
"""
RacePredictor Backend - Simple Startup Script
緊急時のシンプルな起動スクリプト
"""

import os
import sys
import uvicorn

# 環境変数を設定
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ENVIRONMENT", "development")

def main():
    print("🚀 RacePredictor Backend - Emergency Startup")
    print("📍 Database:", os.environ.get("DATABASE_URL"))
    print("🔑 Secret Key:", "***" + os.environ.get("SECRET_KEY", "")[-4:])
    print("🐛 Debug Mode:", os.environ.get("DEBUG"))
    print("🌍 Environment:", os.environ.get("ENVIRONMENT"))
    print("-" * 50)
    
    try:
        # FastAPIアプリケーションを起動
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="debug",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
