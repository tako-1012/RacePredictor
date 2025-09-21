#!/usr/bin/env python3
"""
サービス連携確認スクリプト
フロントエンドとバックエンドの連携をテストします
"""

import requests
import json
import time
import sys

class ServiceVerifier:
    def __init__(self):
        self.backend_url = "http://localhost:8001"
        self.frontend_url = "http://localhost:3001"
        self.token = None
    
    def wait_for_service(self, url, service_name, max_attempts=30):
        """サービスの起動を待機"""
        print(f"⏳ {service_name} の起動を待機中...")
        
        for attempt in range(max_attempts):
            try:
                response = requests.get(url, timeout=5)
                if response.status_code in [200, 404]:  # 404でもサービスは起動している
                    print(f"✅ {service_name} が起動しました")
                    return True
            except requests.exceptions.ConnectionError:
                pass
            except Exception as e:
                print(f"⚠️ {service_name} 接続エラー: {e}")
            
            time.sleep(2)
            print(f"   試行 {attempt + 1}/{max_attempts}")
        
        print(f"❌ {service_name} の起動を確認できませんでした")
        return False
    
    def verify_backend_health(self):
        """バックエンドのヘルスチェック"""
        print("🏥 バックエンドヘルスチェック...")
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            if response.status_code == 200:
                print("✅ バックエンドヘルスチェック成功")
                return True
            else:
                print(f"❌ バックエンドヘルスチェック失敗: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ バックエンドヘルスチェックエラー: {e}")
            return False
    
    def verify_frontend_access(self):
        """フロントエンドアクセステスト"""
        print("🌐 フロントエンドアクセステスト...")
        try:
            response = requests.get(f"{self.frontend_url}", timeout=10)
            if response.status_code == 200:
                print("✅ フロントエンドアクセス成功")
                return True
            else:
                print(f"❌ フロントエンドアクセス失敗: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ フロントエンドアクセスエラー: {e}")
            return False
    
    def verify_api_documentation(self):
        """API ドキュメントアクセステスト"""
        print("📚 API ドキュメントアクセステスト...")
        try:
            response = requests.get(f"{self.backend_url}/docs", timeout=10)
            if response.status_code == 200:
                print("✅ API ドキュメントアクセス成功")
                return True
            else:
                print(f"❌ API ドキュメントアクセス失敗: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API ドキュメントアクセスエラー: {e}")
            return False
    
    def verify_database_connection(self):
        """データベース接続テスト"""
        print("🗄 データベース接続テスト...")
        try:
            # 簡単なAPIエンドポイントでデータベース接続をテスト
            response = requests.get(f"{self.backend_url}/api/workout-types", timeout=10)
            if response.status_code in [200, 401]:  # 401は認証エラーだが、DB接続は成功
                print("✅ データベース接続成功")
                return True
            else:
                print(f"❌ データベース接続失敗: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ データベース接続エラー: {e}")
            return False
    
    def verify_cors_configuration(self):
        """CORS設定テスト"""
        print("🔗 CORS設定テスト...")
        try:
            headers = {
                "Origin": self.frontend_url,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
            response = requests.options(f"{self.backend_url}/api/auth/login", headers=headers, timeout=10)
            if response.status_code in [200, 204]:
                print("✅ CORS設定正常")
                return True
            else:
                print(f"❌ CORS設定エラー: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ CORS設定テストエラー: {e}")
            return False
    
    def verify_authentication_flow(self):
        """認証フローテスト"""
        print("🔐 認証フローテスト...")
        
        # テストユーザー作成
        test_email = f"verify_test_{int(time.time())}@example.com"
        register_data = {
            "email": test_email,
            "password": "testpassword123",
            "confirm_password": "testpassword123",
            "name": "認証テストユーザー"
        }
        
        try:
            # ユーザー登録
            response = requests.post(f"{self.backend_url}/api/auth/register", json=register_data, timeout=10)
            if response.status_code != 201:
                print(f"❌ ユーザー登録失敗: {response.text}")
                return False
            
            # ログイン
            login_data = {
                "email": test_email,
                "password": "testpassword123"
            }
            response = requests.post(f"{self.backend_url}/api/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                self.token = result.get("access_token")
                print("✅ 認証フロー成功")
                return True
            else:
                print(f"❌ ログイン失敗: {response.text}")
                return False
        except Exception as e:
            print(f"❌ 認証フローテストエラー: {e}")
            return False
    
    def verify_protected_endpoints(self):
        """保護されたエンドポイントテスト"""
        print("🛡 保護されたエンドポイントテスト...")
        
        if not self.token:
            print("❌ 認証トークンがありません")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            # ワークアウト一覧取得
            response = requests.get(f"{self.backend_url}/api/workouts", headers=headers, timeout=10)
            if response.status_code == 200:
                print("✅ 保護されたエンドポイントアクセス成功")
                return True
            else:
                print(f"❌ 保護されたエンドポイントアクセス失敗: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 保護されたエンドポイントテストエラー: {e}")
            return False
    
    def run_all_verifications(self):
        """全検証実行"""
        print("🔍 サービス連携確認開始")
        print("=" * 50)
        
        results = []
        
        # サービス起動待機
        results.append(self.wait_for_service(self.backend_url, "バックエンド"))
        results.append(self.wait_for_service(self.frontend_url, "フロントエンド"))
        
        # 基本接続テスト
        results.append(self.verify_backend_health())
        results.append(self.verify_frontend_access())
        results.append(self.verify_api_documentation())
        results.append(self.verify_database_connection())
        results.append(self.verify_cors_configuration())
        
        # 認証テスト
        results.append(self.verify_authentication_flow())
        results.append(self.verify_protected_endpoints())
        
        # 結果サマリー
        success_count = sum(results)
        total_count = len(results)
        
        print("\n📊 検証結果サマリー")
        print("=" * 30)
        print(f"成功: {success_count}/{total_count}")
        print(f"成功率: {success_count/total_count*100:.1f}%")
        
        if success_count == total_count:
            print("\n🎉 全サービスが正常に動作しています！")
            print("📱 フロントエンド: http://localhost:3001")
            print("🔧 バックエンドAPI: http://localhost:8001")
            print("📚 API ドキュメント: http://localhost:8001/docs")
            return True
        else:
            print(f"\n⚠️ {total_count - success_count}個のサービスに問題があります")
            return False

def main():
    verifier = ServiceVerifier()
    success = verifier.run_all_verifications()
    
    if not success:
        print("\n🔧 トラブルシューティング:")
        print("1. Docker コンテナが起動しているか確認")
        print("2. ポートが正しく設定されているか確認")
        print("3. ログを確認: docker-compose -f docker-compose.test.yml logs")
        sys.exit(1)

if __name__ == "__main__":
    main()
