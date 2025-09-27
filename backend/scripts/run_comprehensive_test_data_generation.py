#!/usr/bin/env python3
"""
RunMaster 包括的テストデータ生成・検証統合スクリプト

このスクリプトは以下の機能を提供します：
- 体調管理機能を含む完全なテストデータセット生成
- 生成データの健康性検証
- 練習と体調の相関分析
- 包括的なレポート生成
- データ品質の評価

使用方法:
    python scripts/run_comprehensive_test_data_generation.py [--days 30] [--validate-only]
"""

import sys
import os
import argparse
import logging
from datetime import datetime
from typing import Dict, Any

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.generate_healthy_test_data import HealthyDataGenerator
from scripts.validate_health_data import HealthDataValidator

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ComprehensiveTestDataManager:
    """包括的テストデータ管理クラス"""
    
    def __init__(self):
        """初期化"""
        self.data_generator = HealthyDataGenerator()
        self.data_validator = HealthDataValidator()
        
        logger.info("ComprehensiveTestDataManager initialized")
    
    def generate_and_validate_data(
        self, 
        days: int = 30, 
        validate_only: bool = False
    ) -> Dict[str, Any]:
        """
        データ生成と検証を実行
        
        Args:
            days: 生成する日数
            validate_only: 検証のみ実行するかどうか
            
        Returns:
            実行結果
        """
        try:
            logger.info(f"Starting comprehensive test data generation and validation")
            logger.info(f"Days: {days}, Validate only: {validate_only}")
            
            results = {
                'generation': None,
                'validation': None,
                'timestamp': datetime.now().isoformat(),
                'success': False
            }
            
            # データ生成（検証のみでない場合）
            if not validate_only:
                logger.info("Generating comprehensive test dataset...")
                generation_result = self.data_generator.generate_comprehensive_dataset(days=days)
                results['generation'] = generation_result
                logger.info("Data generation completed")
            else:
                logger.info("Skipping data generation (validate-only mode)")
            
            # データ検証
            logger.info("Validating generated data...")
            validation_report = self.data_validator.generate_comprehensive_report()
            results['validation'] = validation_report
            logger.info("Data validation completed")
            
            results['success'] = True
            
            return results
            
        except Exception as e:
            logger.error(f"Error during comprehensive test data management: {e}")
            results['error'] = str(e)
            results['success'] = False
            return results
    
    def generate_summary_report(self, results: Dict[str, Any]) -> str:
        """サマリーレポートを生成"""
        try:
            report = []
            report.append("=" * 100)
            report.append("RunMaster 包括的テストデータ生成・検証統合レポート")
            report.append("=" * 100)
            report.append(f"実行日時: {results['timestamp']}")
            report.append(f"実行結果: {'成功' if results['success'] else '失敗'}")
            report.append("")
            
            if results.get('generation'):
                report.append("📊 データ生成結果")
                report.append("-" * 50)
                generation = results['generation']
                
                report.append(f"生成されたユーザー数: {len(generation['users'])}")
                report.append(f"生成された練習記録数: {len(generation['workouts'])}")
                report.append(f"生成された体調記録数: {len(generation['daily_metrics'])}")
                
                # ユーザー別の詳細
                report.append("\nユーザー別詳細:")
                for user_data in generation['users']:
                    profile = user_data['profile']
                    report.append(f"  - {profile.name} ({profile.age}歳, {profile.gender})")
                    report.append(f"    フィットネスレベル: {profile.fitness_level}")
                    report.append(f"    週練習回数: {profile.weekly_frequency}回")
                    report.append(f"    目標レース: {profile.target_race}")
            
            if results.get('validation'):
                report.append("\n🔍 データ検証結果")
                report.append("-" * 50)
                
                # 検証レポートから主要な統計を抽出
                validation_lines = results['validation'].split('\n')
                
                # 全体統計を抽出
                in_stats_section = False
                for line in validation_lines:
                    if "全体統計" in line:
                        in_stats_section = True
                        continue
                    elif in_stats_section and line.startswith("📊"):
                        break
                    elif in_stats_section and line.strip():
                        report.append(line)
            
            if results.get('error'):
                report.append("\n❌ エラー情報")
                report.append("-" * 50)
                report.append(f"エラー: {results['error']}")
            
            # 推奨事項
            report.append("\n🎯 推奨事項")
            report.append("-" * 50)
            
            if results['success']:
                report.append("✅ テストデータの生成と検証が正常に完了しました")
                report.append("📝 以下の点を確認してください:")
                report.append("  - 生成されたデータの現実性")
                report.append("  - 体調管理機能の動作確認")
                report.append("  - 練習と体調の相関性")
                report.append("  - データ分析機能のテスト")
            else:
                report.append("⚠️  エラーが発生しました。以下を確認してください:")
                report.append("  - データベース接続の確認")
                report.append("  - 必要なモデルの存在確認")
                report.append("  - ログファイルの詳細確認")
            
            report.append("\n" + "=" * 100)
            report.append("レポート完了")
            report.append("=" * 100)
            
            return "\n".join(report)
            
        except Exception as e:
            logger.error(f"Failed to generate summary report: {e}")
            return f"レポート生成に失敗しました: {e}"


def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(
        description="RunMaster 包括的テストデータ生成・検証統合スクリプト"
    )
    parser.add_argument(
        "--days", 
        type=int, 
        default=30,
        help="生成する日数 (デフォルト: 30)"
    )
    parser.add_argument(
        "--validate-only", 
        action="store_true",
        help="検証のみ実行（データ生成をスキップ）"
    )
    parser.add_argument(
        "--output-dir", 
        type=str, 
        default=".",
        help="出力ディレクトリ (デフォルト: 現在のディレクトリ)"
    )
    
    args = parser.parse_args()
    
    logger.info("Starting RunMaster comprehensive test data generation and validation")
    logger.info(f"Arguments: days={args.days}, validate_only={args.validate_only}")
    
    try:
        # 統合管理クラスの初期化
        manager = ComprehensiveTestDataManager()
        
        # データ生成と検証の実行
        results = manager.generate_and_validate_data(
            days=args.days,
            validate_only=args.validate_only
        )
        
        # サマリーレポートの生成
        summary_report = manager.generate_summary_report(results)
        
        # レポートの表示
        print(summary_report)
        
        # レポートをファイルに保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        mode_suffix = "_validation_only" if args.validate_only else "_full"
        report_filename = f"{args.output_dir}/comprehensive_test_data_report_{timestamp}{mode_suffix}.txt"
        
        with open(report_filename, "w", encoding="utf-8") as f:
            f.write(summary_report)
        
        logger.info(f"Comprehensive test data management completed")
        logger.info(f"Report saved to: {report_filename}")
        
        # 実行結果の確認
        if results['success']:
            logger.info("✅ All operations completed successfully")
            return 0
        else:
            logger.error("❌ Some operations failed")
            return 1
            
    except Exception as e:
        logger.error(f"Error during comprehensive test data management: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
