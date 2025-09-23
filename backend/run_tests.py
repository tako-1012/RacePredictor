#!/usr/bin/env python3
"""
包括的テスト実行スクリプト
"""
import subprocess
import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path


class TestRunner:
    """テストランナークラス"""
    
    def __init__(self):
        self.results = {
            "start_time": datetime.now().isoformat(),
            "phases": {},
            "summary": {}
        }
        self.test_dir = Path(__file__).parent / "tests"
    
    def run_command(self, command, description=""):
        """コマンド実行"""
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
                cwd=Path(__file__).parent
            )
            end_time = time.time()
            
            return {
                "success": result.returncode == 0,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration": end_time - start_time
            }
        except Exception as e:
            end_time = time.time()
            return {
                "success": False,
                "error": str(e),
                "duration": end_time - start_time
            }
    
    def run_phase1_backend_tests(self):
        """Phase 1: バックエンドAPIテスト"""
        print("\n🚀 Phase 1: バックエンドAPIテスト開始")
        
        phase_results = {
            "name": "バックエンドAPIテスト",
            "tests": {}
        }
        
        # 認証APIテスト
        auth_result = self.run_command(
            "python -m pytest tests/test_auth_api.py -v --tb=short",
            "認証APIテスト"
        )
        phase_results["tests"]["認証API"] = auth_result
        
        # 練習記録APIテスト
        workouts_result = self.run_command(
            "python -m pytest tests/test_workouts_api.py -v --tb=short",
            "練習記録APIテスト"
        )
        phase_results["tests"]["練習記録API"] = workouts_result
        
        # レース結果APIテスト
        races_result = self.run_command(
            "python -m pytest tests/test_races_api.py -v --tb=short",
            "レース結果APIテスト"
        )
        phase_results["tests"]["レース結果API"] = races_result
        
        # CSVインポートAPIテスト
        csv_result = self.run_command(
            "python -m pytest tests/test_csv_import_api.py -v --tb=short",
            "CSVインポートAPIテスト"
        )
        phase_results["tests"]["CSVインポートAPI"] = csv_result
        
        # ダッシュボードAPIテスト
        dashboard_result = self.run_command(
            "python -m pytest tests/test_dashboard_api.py -v --tb=short",
            "ダッシュボードAPIテスト"
        )
        phase_results["tests"]["ダッシュボードAPI"] = dashboard_result
        
        # 全体のバックエンドテスト
        all_backend_result = self.run_command(
            "python -m pytest tests/ -v --tb=short --cov=app --cov-report=html --cov-report=term",
            "バックエンド全体テスト（カバレッジ付き）"
        )
        phase_results["tests"]["全体テスト"] = all_backend_result
        
        self.results["phases"]["phase1_backend"] = phase_results
        return phase_results
    
    def run_phase1_frontend_tests(self):
        """Phase 1: フロントエンドコンポーネントテスト"""
        print("\n🎨 Phase 1: フロントエンドコンポーネントテスト開始")
        
        phase_results = {
            "name": "フロントエンドコンポーネントテスト",
            "tests": {}
        }
        
        # フロントエンドディレクトリに移動
        frontend_dir = Path(__file__).parent.parent / "frontend-react"
        
        # 依存関係インストール確認
        install_result = self.run_command(
            "npm install",
            "フロントエンド依存関係インストール"
        )
        phase_results["tests"]["依存関係インストール"] = install_result
        
        # 型チェック
        typecheck_result = self.run_command(
            "npm run type-check",
            "TypeScript型チェック"
        )
        phase_results["tests"]["型チェック"] = typecheck_result
        
        # リント
        lint_result = self.run_command(
            "npm run lint",
            "ESLintチェック"
        )
        phase_results["tests"]["リント"] = lint_result
        
        # コンポーネントテスト
        component_test_result = self.run_command(
            "npm test -- --coverage --watchAll=false",
            "コンポーネントテスト"
        )
        phase_results["tests"]["コンポーネントテスト"] = component_test_result
        
        self.results["phases"]["phase1_frontend"] = phase_results
        return phase_results
    
    def run_phase2_integration_tests(self):
        """Phase 2: 統合テスト"""
        print("\n🔗 Phase 2: 統合テスト開始")
        
        phase_results = {
            "name": "統合テスト",
            "tests": {}
        }
        
        # APIエンドポイント統合テスト
        api_integration_result = self.run_command(
            "python -m pytest tests/test_integration_api.py -v --tb=short",
            "APIエンドポイント統合テスト"
        )
        phase_results["tests"]["API統合テスト"] = api_integration_result
        
        # データベース統合テスト
        db_integration_result = self.run_command(
            "python -m pytest tests/test_integration_database.py -v --tb=short",
            "データベース統合テスト"
        )
        phase_results["tests"]["データベース統合テスト"] = db_integration_result
        
        # ファイル処理統合テスト
        file_integration_result = self.run_command(
            "python -m pytest tests/test_integration_files.py -v --tb=short",
            "ファイル処理統合テスト"
        )
        phase_results["tests"]["ファイル処理統合テスト"] = file_integration_result
        
        self.results["phases"]["phase2_integration"] = phase_results
        return phase_results
    
    def run_phase3_e2e_tests(self):
        """Phase 3: E2Eテスト"""
        print("\n🌐 Phase 3: E2Eテスト開始")
        
        phase_results = {
            "name": "E2Eテスト",
            "tests": {}
        }
        
        # Playwright E2Eテスト
        e2e_result = self.run_command(
            "npx playwright test",
            "Playwright E2Eテスト"
        )
        phase_results["tests"]["E2Eテスト"] = e2e_result
        
        # 複数ブラウザテスト
        browsers = ["chromium", "firefox", "webkit"]
        for browser in browsers:
            browser_result = self.run_command(
                f"npx playwright test --project={browser}",
                f"{browser}ブラウザテスト"
            )
            phase_results["tests"][f"{browser}テスト"] = browser_result
        
        self.results["phases"]["phase3_e2e"] = phase_results
        return phase_results
    
    def run_phase4_performance_tests(self):
        """Phase 4: パフォーマンステスト"""
        print("\n⚡ Phase 4: パフォーマンステスト開始")
        
        phase_results = {
            "name": "パフォーマンステスト",
            "tests": {}
        }
        
        # 負荷テスト
        load_test_result = self.run_command(
            "python -m pytest tests/test_performance_load.py -v --tb=short",
            "負荷テスト"
        )
        phase_results["tests"]["負荷テスト"] = load_test_result
        
        # レスポンス時間テスト
        response_time_result = self.run_command(
            "python -m pytest tests/test_performance_response.py -v --tb=short",
            "レスポンス時間テスト"
        )
        phase_results["tests"]["レスポンス時間テスト"] = response_time_result
        
        # メモリ・CPU使用量テスト
        resource_test_result = self.run_command(
            "python -m pytest tests/test_performance_resources.py -v --tb=short",
            "リソース使用量テスト"
        )
        phase_results["tests"]["リソース使用量テスト"] = resource_test_result
        
        self.results["phases"]["phase4_performance"] = phase_results
        return phase_results
    
    def run_phase5_security_tests(self):
        """Phase 5: セキュリティテスト"""
        print("\n🔒 Phase 5: セキュリティテスト開始")
        
        phase_results = {
            "name": "セキュリティテスト",
            "tests": {}
        }
        
        # 認証・認可テスト
        auth_security_result = self.run_command(
            "python -m pytest tests/test_security_auth.py -v --tb=short",
            "認証・認可セキュリティテスト"
        )
        phase_results["tests"]["認証・認可テスト"] = auth_security_result
        
        # 入力値検証テスト
        input_security_result = self.run_command(
            "python -m pytest tests/test_security_input.py -v --tb=short",
            "入力値検証セキュリティテスト"
        )
        phase_results["tests"]["入力値検証テスト"] = input_security_result
        
        # データ保護テスト
        data_security_result = self.run_command(
            "python -m pytest tests/test_security_data.py -v --tb=short",
            "データ保護セキュリティテスト"
        )
        phase_results["tests"]["データ保護テスト"] = data_security_result
        
        self.results["phases"]["phase5_security"] = phase_results
        return phase_results
    
    def generate_report(self):
        """テストレポート生成"""
        print("\n📊 テストレポート生成中...")
        
        # 成功・失敗の集計
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for phase_name, phase_data in self.results["phases"].items():
            for test_name, test_result in phase_data["tests"].items():
                total_tests += 1
                if test_result["success"]:
                    passed_tests += 1
                else:
                    failed_tests += 1
        
        # サマリー作成
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            "end_time": datetime.now().isoformat()
        }
        
        # レポートファイル出力
        report_file = Path(__file__).parent / "test_report.json"
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        # コンソール出力
        print(f"\n{'='*60}")
        print("📋 テスト結果サマリー")
        print(f"{'='*60}")
        print(f"総テスト数: {total_tests}")
        print(f"成功: {passed_tests}")
        print(f"失敗: {failed_tests}")
        print(f"成功率: {self.results['summary']['success_rate']:.1f}%")
        print(f"{'='*60}")
        
        if failed_tests > 0:
            print("\n❌ 失敗したテスト:")
            for phase_name, phase_data in self.results["phases"].items():
                for test_name, test_result in phase_data["tests"].items():
                    if not test_result["success"]:
                        print(f"  - {phase_name}: {test_name}")
                        if "error" in test_result:
                            print(f"    エラー: {test_result['error']}")
                        elif "stderr" in test_result and test_result["stderr"]:
                            print(f"    エラー: {test_result['stderr'][:200]}...")
        
        return self.results["summary"]["success_rate"] >= 98.0
    
    def run_all_tests(self):
        """全テスト実行"""
        print("🧪 包括的テスト実行開始")
        print(f"開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Phase 1: 単体テスト
            self.run_phase1_backend_tests()
            self.run_phase1_frontend_tests()
            
            # Phase 2: 統合テスト
            self.run_phase2_integration_tests()
            
            # Phase 3: E2Eテスト
            self.run_phase3_e2e_tests()
            
            # Phase 4: パフォーマンステスト
            self.run_phase4_performance_tests()
            
            # Phase 5: セキュリティテスト
            self.run_phase5_security_tests()
            
            # レポート生成
            success = self.generate_report()
            
            if success:
                print("\n🎉 全テストが成功基準を満たしました！")
                return True
            else:
                print("\n⚠️ 一部のテストが失敗しました。詳細はレポートを確認してください。")
                return False
                
        except Exception as e:
            print(f"\n💥 テスト実行中にエラーが発生しました: {e}")
            return False


def main():
    """メイン関数"""
    runner = TestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
