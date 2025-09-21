#!/usr/bin/env python3
"""
包括的テスト実行スクリプト
全フェーズのテストを順次実行し、結果をレポート化
"""

import subprocess
import sys
import json
import time
from datetime import datetime
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.results = {}
        self.start_time = None
        self.end_time = None
        
    def run_command(self, command, description):
        """コマンドを実行し、結果を記録"""
        print(f"\n{'='*60}")
        print(f"実行中: {description}")
        print(f"コマンド: {command}")
        print(f"{'='*60}")
        
        start_time = time.time()
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True,
                timeout=300  # 5分タイムアウト
            )
            end_time = time.time()
            
            self.results[description] = {
                "command": command,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration": end_time - start_time,
                "success": result.returncode == 0
            }
            
            if result.returncode == 0:
                print(f"✅ 成功: {description}")
            else:
                print(f"❌ 失敗: {description}")
                print(f"エラー: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            self.results[description] = {
                "command": command,
                "returncode": -1,
                "stdout": "",
                "stderr": "タイムアウトエラー",
                "duration": 300,
                "success": False
            }
            print(f"⏰ タイムアウト: {description}")
        except Exception as e:
            self.results[description] = {
                "command": command,
                "returncode": -1,
                "stdout": "",
                "stderr": str(e),
                "duration": 0,
                "success": False
            }
            print(f"💥 エラー: {description} - {str(e)}")
    
    def run_backend_tests(self):
        """バックエンドテスト実行"""
        print("\n🚀 Phase 1: バックエンド単体テスト実行")
        
        # 認証APIテスト
        self.run_command(
            "cd backend && python -m pytest tests/test_auth_comprehensive.py -v",
            "認証API包括的テスト"
        )
        
        # 練習記録APIテスト
        self.run_command(
            "cd backend && python -m pytest tests/test_workouts_comprehensive.py -v",
            "練習記録API包括的テスト"
        )
        
        # レース結果APIテスト
        self.run_command(
            "cd backend && python -m pytest tests/test_races_comprehensive.py -v",
            "レース結果API包括的テスト"
        )
        
        # CSVインポートAPIテスト
        self.run_command(
            "cd backend && python -m pytest tests/test_csv_import_comprehensive.py -v",
            "CSVインポートAPI包括的テスト"
        )
        
        # ダッシュボードAPIテスト
        self.run_command(
            "cd backend && python -m pytest tests/test_dashboard_comprehensive.py -v",
            "ダッシュボードAPI包括的テスト"
        )
    
    def run_integration_tests(self):
        """統合テスト実行"""
        print("\n🔗 Phase 2: 統合テスト実行")
        
        self.run_command(
            "cd backend && python -m pytest tests/test_integration_comprehensive.py -v",
            "統合テスト包括的テスト"
        )
    
    def run_performance_tests(self):
        """パフォーマンステスト実行"""
        print("\n⚡ Phase 4: パフォーマンステスト実行")
        
        self.run_command(
            "cd backend && python -m pytest tests/test_performance_comprehensive.py -v",
            "パフォーマンステスト包括的テスト"
        )
    
    def run_security_tests(self):
        """セキュリティテスト実行"""
        print("\n🔒 Phase 5: セキュリティテスト実行")
        
        self.run_command(
            "cd backend && python -m pytest tests/test_security_comprehensive.py -v",
            "セキュリティテスト包括的テスト"
        )
    
    def run_frontend_tests(self):
        """フロントエンドテスト実行"""
        print("\n🎨 Phase 1: フロントエンドテスト実行")
        
        # コンポーネントテスト
        self.run_command(
            "cd frontend-react && npm test -- --testPathPattern=AuthComponents.test.tsx --watchAll=false",
            "認証コンポーネントテスト"
        )
        
        self.run_command(
            "cd frontend-react && npm test -- --testPathPattern=WorkoutComponents.test.tsx --watchAll=false",
            "練習記録コンポーネントテスト"
        )
    
    def run_e2e_tests(self):
        """E2Eテスト実行"""
        print("\n🌐 Phase 3: E2Eテスト実行")
        
        # Playwrightテスト
        self.run_command(
            "cd frontend-react && npx playwright test tests/e2e/UserJourney.test.tsx",
            "ユーザージャーニーE2Eテスト"
        )
    
    def generate_report(self):
        """テストレポート生成"""
        self.end_time = time.time()
        total_duration = self.end_time - self.start_time
        
        # 成功・失敗の集計
        total_tests = len(self.results)
        successful_tests = sum(1 for result in self.results.values() if result["success"])
        failed_tests = total_tests - successful_tests
        
        # レポート生成
        report = {
            "summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": failed_tests,
                "success_rate": (successful_tests / total_tests * 100) if total_tests > 0 else 0,
                "total_duration": total_duration,
                "timestamp": datetime.now().isoformat()
            },
            "results": self.results
        }
        
        # JSONレポート保存
        with open("test_results_comprehensive.json", "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # コンソールレポート表示
        print(f"\n{'='*80}")
        print("📊 包括的テスト実行結果")
        print(f"{'='*80}")
        print(f"総テスト数: {total_tests}")
        print(f"成功: {successful_tests}")
        print(f"失敗: {failed_tests}")
        print(f"成功率: {report['summary']['success_rate']:.1f}%")
        print(f"総実行時間: {total_duration:.2f}秒")
        print(f"{'='*80}")
        
        # 失敗したテストの詳細
        if failed_tests > 0:
            print("\n❌ 失敗したテスト:")
            for description, result in self.results.items():
                if not result["success"]:
                    print(f"  - {description}")
                    print(f"    エラー: {result['stderr'][:200]}...")
        
        # 成功基準の確認
        print(f"\n🎯 成功基準:")
        print(f"  - 全単体テスト: 98%以上パス {'✅' if report['summary']['success_rate'] >= 98 else '❌'}")
        print(f"  - 全統合テスト: 100%パス {'✅' if failed_tests == 0 else '❌'}")
        print(f"  - 全E2Eテスト: 100%パス {'✅' if failed_tests == 0 else '❌'}")
        print(f"  - パフォーマンス: 目標値以内 {'✅' if failed_tests == 0 else '❌'}")
        print(f"  - セキュリティ: 重大な脆弱性なし {'✅' if failed_tests == 0 else '❌'}")
        
        return report
    
    def run_all_tests(self):
        """全テスト実行"""
        self.start_time = time.time()
        
        print("🚀 包括的テスト実行開始")
        print(f"開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Phase 1: 単体テスト
            self.run_backend_tests()
            self.run_frontend_tests()
            
            # Phase 2: 統合テスト
            self.run_integration_tests()
            
            # Phase 3: E2Eテスト
            self.run_e2e_tests()
            
            # Phase 4: パフォーマンステスト
            self.run_performance_tests()
            
            # Phase 5: セキュリティテスト
            self.run_security_tests()
            
        except KeyboardInterrupt:
            print("\n⏹️ テスト実行が中断されました")
        except Exception as e:
            print(f"\n💥 予期しないエラー: {str(e)}")
        
        # レポート生成
        report = self.generate_report()
        return report

def main():
    """メイン実行関数"""
    runner = TestRunner()
    report = runner.run_all_tests()
    
    # 終了コード設定
    if report["summary"]["failed_tests"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
