'use client'

import HeroSection from './HeroSection'
import FeaturePreviewGrid from './FeaturePreviewGrid'
import ProblemSection from './ProblemSection'
import FeatureSection from './FeatureSection'
import RunningMythsSection from './RunningMythsSection'
import AdvancedRunnerSection from './AdvancedRunnerSection'
import BeginnerRunnerSection from './BeginnerRunnerSection'
// import EnhancedVisualImpact from './EnhancedVisualImpact'
// import BetaTesterSection from './BetaTesterSection'
// import TestimonialSection from './TestimonialSection'
// import CTAFooter from './CTAFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <HeroSection />
      
      {/* 競技者向けセクション */}
      <AdvancedRunnerSection />
      
      {/* 初心者向けセクション */}
      <BeginnerRunnerSection />
      
      {/* 機能プレビューセクション */}
      <FeaturePreviewGrid />
      
      {/* 機能紹介セクション */}
      <FeatureSection />
    </div>
  )
}
