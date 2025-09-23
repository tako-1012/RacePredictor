#!/usr/bin/env python3
"""
包括的テスト実行スクリプト（ルートディレクトリ版）
"""
import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description=""):
    """コマンド実行"""
    print(f"\n{'='*60}")
    print(f"実行中: {description}")
    print(f"コマンド: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ 成功")
            if result.stdout:
                print(f"出力: {result.stdout}")
        else:
            print("❌ 失敗")
            if result.stderr:
                print(f"エラー: {result.stderr}")
        
        return result.returncode == 0
    except Exception as e:
        print(f"💥 エラー: {e}")
        return False


def main():
    """メイン関数"""
    print("🧪 RacePredictor 包括的テスト実行")
    
    # バックエンドテスト実行
    print("\n🔧 バックエンドテスト実行")
    backend_success = run_command(
        "cd backend && source venv/bin/activate && python run_tests.py",
        "バックエンドテスト"
    )
    
    # フロントエンドテスト実行
    print("\n🎨 フロントエンドテスト実行")
    frontend_success = run_command(
        "cd frontend-react && npm test",
        "フロントエンドテスト"
    )
    
    # E2Eテスト実行
    print("\n🌐 E2Eテスト実行")
    e2e_success = run_command(
        "cd frontend-react && npm run e2e",
        "E2Eテスト"
    )
    
    # 結果サマリー
    print(f"\n{'='*60}")
    print("📋 テスト結果サマリー")
    print(f"{'='*60}")
    print(f"バックエンドテスト: {'✅ 成功' if backend_success else '❌ 失敗'}")
    print(f"フロントエンドテスト: {'✅ 成功' if frontend_success else '❌ 失敗'}")
    print(f"E2Eテスト: {'✅ 成功' if e2e_success else '❌ 失敗'}")
    
    all_success = backend_success and frontend_success and e2e_success
    print(f"\n全体結果: {'🎉 全テスト成功' if all_success else '⚠️ 一部テスト失敗'}")
    
    return 0 if all_success else 1


if __name__ == "__main__":
    sys.exit(main())
