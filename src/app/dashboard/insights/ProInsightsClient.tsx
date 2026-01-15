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

      {/* Charts */}
      {sleepLogs.length >= 3 && (
        <>
          {/* Sleep Duration Trends */}
          <SleepDurationChart sleepLogs={filteredLogs} profile={profile} />

          {/* Recovery Score Trend */}
          <RecoveryScoreChart sleepLogs={filteredLogs} profile={profile} />

          {/* Sleep Quality & Energy */}
          <SleepQualityChart sleepLogs={filteredLogs} />

          {/* Sleep Timing Patterns */}
          <SleepTimingChart sleepLogs={filteredLogs} />

          {/* Sleep Consistency Score */}
          <SleepConsistencyCard sleepLogs={sleepLogs} profile={profile} />

          {/* Weekly Comparison */}
          <WeeklyComparisonChart sleepLogs={sleepLogs} profile={profile} />

          {/* Personalized Insights */}
          <InsightsRecommendations
            sleepLogs={sleepLogs}
            checklistLogs={checklistLogs}
            profile={profile}
          />
        </>
      )}

      {sleepLogs.length < 3 && (
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <p className="text-text-muted">
            Log at least 3 nights to view visual analytics.
          </p>
        </div>
      )}
    </div>
  );
}
