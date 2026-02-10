'use client';

import { useState } from 'react';
import {
  SleepDurationChart,
  SleepQualityChart,
  RecoveryScoreChart,
  SleepTimingChart,
  SleepConsistencyCard,
  WeeklyComparisonChart,
  InsightsRecommendations,
} from '@/components/ProInsights';
import { AnimatedChartContainer } from '@/components/AnimatedInsights';
import type { SleepLog, ChecklistLog, Profile } from '@/types';

interface ProInsightsClientProps {
  sleepLogs: SleepLog[];
  checklistLogs: ChecklistLog[];
  profile: Profile;
}

export function ProInsightsClient({ sleepLogs, checklistLogs, profile }: ProInsightsClientProps) {
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('14');

  // Filter logs based on date range
  const filteredLogs = sleepLogs.slice(0, parseInt(dateRange));

  return (
    <div className="space-y-4">
      {/* Date range selector */}
      <AnimatedChartContainer delay={0}>
        <div className="flex items-center gap-2 bg-card rounded-lg p-1 border border-border">
          {(['7', '14', '30'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-background'
              }`}
            >
              {range} days
            </button>
          ))}
        </div>
      </AnimatedChartContainer>

      {/* Charts */}
      {sleepLogs.length >= 3 && (
        <>
          {/* Sleep Duration Trends */}
          <AnimatedChartContainer delay={0.1}>
            <SleepDurationChart sleepLogs={filteredLogs} profile={profile} />
          </AnimatedChartContainer>

          {/* Recovery Score Trend */}
          <AnimatedChartContainer delay={0.15}>
            <RecoveryScoreChart sleepLogs={filteredLogs} profile={profile} />
          </AnimatedChartContainer>

          {/* Sleep Quality & Energy */}
          <AnimatedChartContainer delay={0.2}>
            <SleepQualityChart sleepLogs={filteredLogs} />
          </AnimatedChartContainer>

          {/* Sleep Timing Patterns */}
          <AnimatedChartContainer delay={0.25}>
            <SleepTimingChart sleepLogs={filteredLogs} />
          </AnimatedChartContainer>

          {/* Sleep Consistency Score */}
          <AnimatedChartContainer delay={0.3}>
            <SleepConsistencyCard sleepLogs={sleepLogs} profile={profile} />
          </AnimatedChartContainer>

          {/* Weekly Comparison */}
          <AnimatedChartContainer delay={0.35}>
            <WeeklyComparisonChart sleepLogs={sleepLogs} profile={profile} />
          </AnimatedChartContainer>

          {/* Personalized Insights */}
          <AnimatedChartContainer delay={0.4}>
            <InsightsRecommendations
              sleepLogs={sleepLogs}
              checklistLogs={checklistLogs}
              profile={profile}
            />
          </AnimatedChartContainer>
        </>
      )}

      {sleepLogs.length < 3 && (
        <AnimatedChartContainer delay={0.1}>
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-text-muted">
              Log at least 3 nights to view visual analytics.
            </p>
          </div>
        </AnimatedChartContainer>
      )}
    </div>
  );
}
