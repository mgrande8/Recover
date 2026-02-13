import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Star,
  Moon,
  Zap,
  Lock,
  Crown,
  Battery,
  BarChart3,
  Target,
  Calendar,
  Coffee,
  Wine,
  Dumbbell,
  Smartphone,
  Sun,
  UtensilsCrossed,
  Thermometer,
  BedDouble,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';
import type { Profile, SleepLog, ChecklistLog } from '@/types';
import { ProInsightsClient } from './ProInsightsClient';
import {
  AnimatedInsightCard,
  AnimatedSectionHeader,
  AnimatedTipsList,
  AnimatedChartContainer,
  AnimatedStatsGrid,
} from '@/components/AnimatedInsights';

// Insight card component with animation
function InsightCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  description,
  trend,
  index = 0,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  index?: number;
}) {
  return (
    <AnimatedInsightCard index={index}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-text-secondary">{title}</p>
              {trend && (
                <div className={`flex items-center gap-1 ${
                  trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted'
                }`}>
                  {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                   trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
        </div>
      </div>
    </AnimatedInsightCard>
  );
}

// Locked insight card for Pro features with animation
function LockedInsightCard({ title, description, index = 0 }: { title: string; description: string; index?: number }) {
  return (
    <AnimatedInsightCard index={index}>
      <div className="bg-card rounded-xl border border-border p-4 opacity-60">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-card-hover flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-text-muted" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-text-secondary">{title}</p>
              <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                PRO
              </span>
            </div>
            <p className="text-sm text-text-muted">{description}</p>
          </div>
        </div>
      </div>
    </AnimatedInsightCard>
  );
}

// Sleep Debt Tracker (Pro Feature) with animation
function SleepDebtTracker({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  const goalMinutes = profile.sleep_goal_hours * 60;

  // Calculate cumulative sleep debt over the past 14 days
  const recentLogs = sleepLogs.slice(0, 14);
  let totalDebt = 0;

  recentLogs.forEach((log) => {
    if (log.is_nap) {
      // Naps always ADD to sleep bank (no goal subtraction)
      totalDebt += log.duration_minutes;
    } else {
      // Night sleep: compare against goal
      const diff = log.duration_minutes - goalMinutes;
      totalDebt += diff;
    }
  });

  // Convert to hours
  const debtHours = Math.abs(totalDebt) / 60;
  const isDebt = totalDebt < 0;

  // Calculate days to recover (assuming 30 min extra sleep per night)
  const daysToRecover = isDebt ? Math.ceil(debtHours / 0.5) : 0;

  return (
    <AnimatedInsightCard index={0}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${isDebt ? 'bg-danger/10' : 'bg-success/10'} flex items-center justify-center flex-shrink-0`}>
            <Battery className={`w-6 h-6 ${isDebt ? 'text-danger' : 'text-success'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-text-secondary">Sleep Debt Tracker</p>
              <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                PRO
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDebt ? 'text-danger' : 'text-success'} mb-1`}>
              {isDebt ? '-' : '+'}{debtHours.toFixed(1)}h
            </p>
            <p className="text-sm text-text-secondary">
              {isDebt
                ? `You owe ${debtHours.toFixed(1)} hours of sleep. At 30 min extra per night, you'll recover in ~${daysToRecover} days.`
                : `You're ahead! You've banked ${debtHours.toFixed(1)} hours of extra sleep over the past 2 weeks.`}
            </p>
          </div>
        </div>
      </div>
    </AnimatedInsightCard>
  );
}

// Helper function to normalize date strings for comparison
function normalizeDate(dateStr: string): string {
  // Handle various date formats and return YYYY-MM-DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toISOString().split('T')[0];
}

// Correlation Analysis (Pro Feature) with animation
function CorrelationAnalysis({ sleepLogs, checklistLogs, profile }: { sleepLogs: SleepLog[]; checklistLogs: ChecklistLog[]; profile: Profile }) {
  const requiredChecklists = 5;
  const currentCount = checklistLogs.length;
  const progress = Math.min(currentCount / requiredChecklists, 1);

  if (currentCount < requiredChecklists) {
    return (
      <AnimatedInsightCard index={1}>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-text-secondary">Correlation Analysis</p>
                <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                  PRO
                </span>
              </div>
              <p className="text-sm text-text-primary font-medium mb-2">
                🎯 {requiredChecklists - currentCount} more night{requiredChecklists - currentCount === 1 ? "'s" : "s'"} checklist to unlock!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted font-medium">{currentCount}/{requiredChecklists}</span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedInsightCard>
    );
  }

  // Calculate correlations between checklist items and sleep quality
  // Now analyzing ALL 8 habits for complete correlation insights
  const checklistItems = [
    { key: 'exercised', label: 'Exercise', icon: Dumbbell },
    { key: 'no_caffeine_after_2pm', label: 'No late caffeine', icon: Coffee },
    { key: 'no_alcohol', label: 'No alcohol', icon: Wine },
    { key: 'no_heavy_meal', label: 'Light dinner', icon: UtensilsCrossed },
    { key: 'room_dark', label: 'Dark room', icon: Moon },
    { key: 'room_cool', label: 'Cool room', icon: Thermometer },
    { key: 'screens_off_30min', label: 'No screens', icon: Smartphone },
    { key: 'phone_not_in_bed', label: 'Phone away', icon: BedDouble },
  ];

  const correlations = checklistItems.map((item) => {
    // Match checklist logs with sleep logs by date (normalize dates for comparison)
    const matchedData: { checked: boolean; quality: number }[] = [];

    checklistLogs.forEach((cl) => {
      const clDate = normalizeDate(cl.date);
      const sleepLog = sleepLogs.find((sl) => normalizeDate(sl.date) === clDate);
      if (sleepLog && sleepLog.quality != null) {
        matchedData.push({
          checked: cl[item.key as keyof ChecklistLog] as boolean,
          quality: sleepLog.quality,
        });
      }
    });

    if (matchedData.length < 3) return { ...item, impact: 0, avgWithout: 0, avgWith: 0 };

    const withItem = matchedData.filter((d) => d.checked);
    const withoutItem = matchedData.filter((d) => !d.checked);

    const avgWith = withItem.length > 0
      ? withItem.reduce((sum, d) => sum + d.quality, 0) / withItem.length
      : 0;
    const avgWithout = withoutItem.length > 0
      ? withoutItem.reduce((sum, d) => sum + d.quality, 0) / withoutItem.length
      : 0;

    return {
      ...item,
      impact: avgWith - avgWithout,
      avgWith,
      avgWithout,
    };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const topCorrelation = correlations[0];

  return (
    <AnimatedInsightCard index={1}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <p className="font-semibold text-text-primary">Correlation Analysis</p>
          <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
            PRO
          </span>
        </div>

        <div className="space-y-3">
          {correlations.slice(0, 4).map((corr) => {
            const Icon = corr.icon;
            const isPositive = corr.impact > 0;
            const impactPercent = Math.abs(corr.impact / 5 * 100);

            return (
              <div key={corr.key} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{corr.label}</p>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${isPositive ? 'bg-success' : 'bg-danger'} transition-all`}
                      style={{ width: `${Math.min(impactPercent, 100)}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium ${isPositive ? 'text-success' : corr.impact < 0 ? 'text-danger' : 'text-text-muted'}`}>
                  {isPositive ? '+' : ''}{corr.impact.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>

        {topCorrelation && Math.abs(topCorrelation.impact) > 0.2 && (
          <p className="text-xs text-text-muted mt-4 p-2 bg-background rounded-lg">
            {topCorrelation.impact > 0
              ? `${topCorrelation.label} has the biggest positive impact on your sleep quality.`
              : `Skipping ${topCorrelation.label.toLowerCase()} tends to hurt your sleep quality.`}
          </p>
        )}
      </div>
    </AnimatedInsightCard>
  );
}

// Optimal Bedtime Calculator (Pro Feature) with animation
function OptimalBedtime({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  const requiredLogs = 7;
  // Filter out naps for this calculation
  const nightSleepLogs = sleepLogs.filter((log) => !log.is_nap);
  const currentCount = nightSleepLogs.length;
  const progress = Math.min(currentCount / requiredLogs, 1);

  if (currentCount < requiredLogs) {
    return (
      <AnimatedInsightCard index={2}>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Moon className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-text-secondary">Optimal Bedtime</p>
                <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                  PRO
                </span>
              </div>
              <p className="text-sm text-text-primary font-medium mb-2">
                🎯 {requiredLogs - currentCount} more {requiredLogs - currentCount === 1 ? 'night' : 'nights'} to unlock!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted font-medium">{currentCount}/{requiredLogs}</span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedInsightCard>
    );
  }

  // Get user's typical bedtime as reference (parse HH:MM format)
  const [typicalHour, typicalMin] = (profile.typical_bedtime || '22:30').split(':').map(Number);
  let typicalBedtimeHour = typicalHour + (typicalMin || 0) / 60;
  // Normalize typical bedtime to evening scale (if before 12, assume after midnight)
  if (typicalBedtimeHour < 12) typicalBedtimeHour += 24;

  // Find bedtimes that resulted in best quality sleep
  // Exclude naps - they shouldn't affect optimal bedtime calculation
  // Filter to only include reasonable bedtimes (6 PM to 3 AM, normalized as 18-27)
  const bedtimeQuality = sleepLogs
    .filter((log) => !log.is_nap) // Exclude naps from bedtime analysis
    .map((log) => {
      const bedtime = new Date(log.bedtime);
      let hour = bedtime.getHours() + bedtime.getMinutes() / 60;
      // Normalize: hours 0-5 (midnight to 5 AM) become 24-29
      if (hour < 6) hour += 24;

      return {
        hour,
        quality: log.quality,
        energy: log.energy,
        score: calculateRecoveryScore(log, profile).score,
      };
    })
    // Filter out unreasonable bedtimes (before 5 PM or after 5 AM)
    // Reasonable range: 17 (5 PM) to 29 (5 AM)
    .filter((bq) => bq.hour >= 17 && bq.hour <= 29);

  if (bedtimeQuality.length < 3) {
    // Not enough reasonable bedtime data
    const needed = 3 - bedtimeQuality.length;
    return (
      <AnimatedInsightCard index={2}>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Moon className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-text-secondary">Optimal Bedtime</p>
                <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                  PRO
                </span>
              </div>
              <p className="text-sm text-text-primary font-medium mb-1">
                🎯 {needed} more regular {needed === 1 ? 'night' : 'nights'} needed
              </p>
              <p className="text-xs text-text-muted">Log sleep with bedtimes between 5 PM - 5 AM for best results.</p>
            </div>
          </div>
        </div>
      </AnimatedInsightCard>
    );
  }

  // Group bedtimes into 30-min windows and find the best
  const windows: Record<string, { total: number; count: number; avgScore: number }> = {};

  bedtimeQuality.forEach((bq) => {
    const windowStart = Math.floor(bq.hour * 2) / 2; // Round to nearest 30 min
    const key = windowStart.toString();

    if (!windows[key]) {
      windows[key] = { total: 0, count: 0, avgScore: 0 };
    }
    windows[key].total += bq.score;
    windows[key].count += 1;
  });

  // Calculate averages
  Object.keys(windows).forEach((key) => {
    windows[key].avgScore = windows[key].total / windows[key].count;
  });

  // Calculate overall average score to use as baseline
  const allScores = bedtimeQuality.map((bq) => bq.score);
  const avgOverallScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  // Find best window, strongly preferring times close to typical bedtime
  // Only recommend a different time if it has significantly better scores
  let bestWindow = { hour: typicalBedtimeHour, avgScore: avgOverallScore };

  // First, look for windows within 2 hours of typical bedtime
  const nearbyWindows: { hour: number; avgScore: number; count: number }[] = [];
  Object.entries(windows).forEach(([key, data]) => {
    const windowHour = parseFloat(key);
    const distance = Math.abs(windowHour - typicalBedtimeHour);

    // Only consider windows within 2 hours of typical bedtime
    if (distance <= 2 && data.count >= 1) {
      nearbyWindows.push({ hour: windowHour, avgScore: data.avgScore, count: data.count });
    }
  });

  // If we have nearby windows, find the best one
  if (nearbyWindows.length > 0) {
    // Sort by score (highest first), then by proximity to typical bedtime
    nearbyWindows.sort((a, b) => {
      const scoreDiff = b.avgScore - a.avgScore;
      if (Math.abs(scoreDiff) > 3) return scoreDiff; // Prefer higher score if difference > 3
      // If scores are similar, prefer closer to typical bedtime
      return Math.abs(a.hour - typicalBedtimeHour) - Math.abs(b.hour - typicalBedtimeHour);
    });
    bestWindow = { hour: nearbyWindows[0].hour, avgScore: nearbyWindows[0].avgScore };
  } else {
    // No nearby data - just use typical bedtime
    bestWindow = { hour: typicalBedtimeHour, avgScore: avgOverallScore };
  }

  // Format time - handle the 24+ hour normalization
  let displayHour = bestWindow.hour;
  if (displayHour >= 24) displayHour -= 24;

  const hours = Math.floor(displayHour);
  const minutes = Math.round((displayHour % 1) * 60);
  const meridian = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${meridian}`;

  // Calculate ideal wake time
  let idealWakeHour = displayHour + profile.sleep_goal_hours;
  if (idealWakeHour >= 24) idealWakeHour -= 24;

  const wakeHours = Math.floor(idealWakeHour);
  const wakeMeridian = wakeHours >= 12 ? 'PM' : 'AM';
  const displayWakeHours = wakeHours > 12 ? wakeHours - 12 : wakeHours === 0 ? 12 : wakeHours;
  const formattedWakeTime = `${displayWakeHours}:${minutes.toString().padStart(2, '0')} ${wakeMeridian}`;

  return (
    <AnimatedInsightCard index={2}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Moon className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-text-secondary">Optimal Bedtime</p>
              <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                PRO
              </span>
            </div>
            <p className="text-2xl font-bold text-warning mb-1">{formattedTime}</p>
            <p className="text-sm text-text-secondary">
              Based on your sleep patterns near your typical bedtime, {formattedTime} gives you optimal recovery (avg score: {Math.round(bestWindow.avgScore)}).
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
              <Sun className="w-3.5 h-3.5" />
              <span>Ideal wake time: {formattedWakeTime}</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedInsightCard>
  );
}

// Weekly Report Summary (Pro Feature) with animation
function WeeklyReport({ sleepLogs, checklistLogs, profile }: { sleepLogs: SleepLog[]; checklistLogs: ChecklistLog[]; profile: Profile }) {
  const thisWeek = sleepLogs.slice(0, 7);
  const lastWeek = sleepLogs.slice(7, 14);

  if (thisWeek.length < 3) {
    return (
      <AnimatedInsightCard index={3}>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-text-secondary">Weekly Report</p>
                <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                  PRO
                </span>
              </div>
              <p className="text-sm text-text-muted">Log at least 3 nights this week to generate your weekly report.</p>
            </div>
          </div>
        </div>
      </AnimatedInsightCard>
    );
  }

  // Calculate this week's stats
  const avgDuration = thisWeek.reduce((sum, log) => sum + log.duration_minutes, 0) / thisWeek.length;
  const avgQuality = thisWeek.reduce((sum, log) => sum + log.quality, 0) / thisWeek.length;
  const avgEnergy = thisWeek.reduce((sum, log) => sum + log.energy, 0) / thisWeek.length;
  const avgScore = thisWeek.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) / thisWeek.length;

  // Calculate last week's stats for comparison
  let weekOverWeekScore = 0;
  if (lastWeek.length >= 3) {
    const lastWeekScore = lastWeek.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) / lastWeek.length;
    weekOverWeekScore = avgScore - lastWeekScore;
  }

  // Find best and worst nights
  const scoredLogs = thisWeek.map((log) => ({
    ...log,
    score: calculateRecoveryScore(log, profile).score,
  }));
  const bestNight = scoredLogs.reduce((best, log) => log.score > best.score ? log : best, scoredLogs[0]);
  const worstNight = scoredLogs.reduce((worst, log) => log.score < worst.score ? log : worst, scoredLogs[0]);

  return (
    <AnimatedInsightCard index={3}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-success" />
          <p className="font-semibold text-text-primary">Weekly Report</p>
          <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
            PRO
          </span>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-background rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Avg Recovery</p>
            <p className="text-xl font-bold text-text-primary">{Math.round(avgScore)}</p>
            {weekOverWeekScore !== 0 && (
              <p className={`text-xs ${weekOverWeekScore > 0 ? 'text-success' : 'text-danger'}`}>
                {weekOverWeekScore > 0 ? '+' : ''}{Math.round(weekOverWeekScore)} vs last week
              </p>
            )}
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Avg Duration</p>
            <p className="text-xl font-bold text-text-primary">{formatDuration(Math.round(avgDuration))}</p>
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Avg Quality</p>
            <p className="text-xl font-bold text-text-primary">{avgQuality.toFixed(1)}/5</p>
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Avg Energy</p>
            <p className="text-xl font-bold text-text-primary">{avgEnergy.toFixed(1)}/5</p>
          </div>
        </div>

        {/* Best and worst nights */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Best night</span>
            <span className="text-success font-medium">
              {new Date(bestNight.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — {bestNight.score}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Worst night</span>
            <span className="text-danger font-medium">
              {new Date(worstNight.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — {worstNight.score}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Nights logged</span>
            <span className="text-text-primary font-medium">{thisWeek.length} of 7</span>
          </div>
        </div>
      </div>
    </AnimatedInsightCard>
  );
}

// Date-seeded tip index helper for daily rotation
function getDailyTipIndex(date: string, poolSize: number, offset: number = 0): number {
  let hash = 0;
  const seed = date + offset.toString();
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % poolSize;
}

// Expanded personalized recommendations based on user type (~14 sleep-focused tips each)
const userTypeRecommendations: Record<string, { title: string; tips: { icon: React.ElementType; text: string }[] }> = {
  athlete: {
    title: 'Athlete Sleep Guide',
    tips: [
      { icon: Clock, text: 'Aim for 8-10 hours of sleep. Studies show elite athletes who increased sleep to 8.5h improved sprint speed by 4% and reaction time by 12%.' },
      { icon: Moon, text: 'Take strategic 20-30 min naps before training or competition to enhance alertness and power output.' },
      { icon: Zap, text: 'Sleep drives growth hormone and testosterone release essential for muscle repair. Even one poor night can reduce testosterone by 25%.' },
      { icon: Sun, text: 'Get morning sunlight within 1 hour of waking to regulate your circadian rhythm and improve sleep quality.' },
      { icon: Clock, text: 'Sleep within 2 hours of your usual bedtime on rest days. Irregular schedules impair athletic performance more than short sleep.' },
      { icon: Moon, text: 'Cool your bedroom to 60-67°F (16-19°C). Core body temperature must drop for deep sleep, which is when muscles repair.' },
      { icon: Zap, text: 'Avoid intense training within 3 hours of bedtime. Elevated cortisol and body temperature delay sleep onset by up to 40 minutes.' },
      { icon: Dumbbell, text: 'Post-workout protein with tart cherry juice supports both muscle recovery and natural melatonin production for better sleep.' },
      { icon: Clock, text: 'After travel across time zones, expose yourself to sunlight at your destination to reset your body clock faster.' },
      { icon: Moon, text: 'Two consecutive nights of poor sleep can reduce endurance performance by up to 11%. Prioritize sleep like training.' },
      { icon: Coffee, text: 'Stop caffeine intake at least 6 hours before bed. It blocks adenosine, the chemical that builds sleep pressure.' },
      { icon: Zap, text: 'Deep sleep increases blood flow to muscles by 40%. This stage is critical for tissue repair after hard training sessions.' },
      { icon: Sun, text: 'Morning light exposure for 10+ minutes increases evening melatonin production, helping you fall asleep faster at night.' },
      { icon: Clock, text: 'Weekend sleep-ins of more than 1 hour create "social jet lag," reducing your Monday performance significantly.' },
    ],
  },
  professional: {
    title: 'Professional Sleep Guide',
    tips: [
      { icon: Clock, text: 'Use the 8-8-8 framework: 8 hours work, 8 hours personal time, 8 hours sleep for optimal productivity.' },
      { icon: Target, text: 'Sleep improves focus, decision-making, and memory. Workers with sufficient sleep have faster reaction times and fewer mistakes.' },
      { icon: Coffee, text: 'Limit caffeine after 2 PM. A 15-20 min power nap between 1-3 PM can boost afternoon alertness.' },
      { icon: Smartphone, text: 'Avoid screens 30-60 min before bed. Blue light suppresses melatonin and delays sleep onset.' },
      { icon: Moon, text: 'A consistent wind-down routine signals your brain to shift from "work mode." Try reading, journaling, or light stretching.' },
      { icon: Clock, text: 'Sleep deprivation costs the US economy $411 billion/year in lost productivity. Investing in sleep pays dividends at work.' },
      { icon: Zap, text: 'After learning new skills or information, sleep consolidates those memories. Study before bed for better retention.' },
      { icon: Target, text: 'One week of sleeping 6 hours/night impairs cognitive performance as much as two full nights without sleep.' },
      { icon: Sun, text: 'Take a 10-minute outdoor walk at lunch. Midday light exposure improves afternoon focus and nighttime sleep quality.' },
      { icon: Coffee, text: 'Replace afternoon coffee with a short walk or cold water splash. These boost alertness without disrupting sleep.' },
      { icon: Moon, text: 'Keep work materials out of the bedroom. Your brain associates environments with activities—bed should mean sleep.' },
      { icon: Smartphone, text: 'Use night mode on devices after sunset. Even dim blue light in the evening can delay melatonin release by 90 minutes.' },
      { icon: Clock, text: 'A 20-minute nap improves alertness by 54% and performance by 34%, without the grogginess of longer naps.' },
      { icon: Zap, text: 'Sleep-deprived professionals are 4.2x more likely to make errors. Prioritize rest before important presentations or decisions.' },
    ],
  },
  parent: {
    title: 'Parent Sleep Survival Guide',
    tips: [
      { icon: Moon, text: 'Nap when baby naps. Even 20-30 min power naps can significantly boost your alertness and mood.' },
      { icon: Clock, text: 'Split night duties with your partner if possible. Uninterrupted sleep blocks are more restorative than fragmented sleep.' },
      { icon: Zap, text: 'Protein-rich snacks with complex carbs (like peanut butter toast) provide sustained energy during night feeds.' },
      { icon: Sun, text: 'Get outside daily, even for 10 minutes. Sunlight helps regulate your body clock and improves mental health.' },
      { icon: Moon, text: 'Use blackout curtains and white noise for both you and baby. A dark, consistent environment improves sleep for everyone.' },
      { icon: Clock, text: 'Even 15 minutes of "me time" before bed (reading, tea, deep breathing) helps your brain transition to sleep mode.' },
      { icon: Coffee, text: 'If you need caffeine, have it before noon. Afternoon caffeine stays in your system and fragments already limited sleep.' },
      { icon: Zap, text: 'Light stretching or gentle yoga before bed releases muscle tension from carrying children and improves sleep onset.' },
      { icon: Moon, text: 'Keep a dim nightlight for nighttime check-ins instead of turning on overhead lights, which reset your sleep clock.' },
      { icon: Sun, text: 'Morning sunlight exposure helps regulate both your and your child\'s circadian rhythms for better family sleep patterns.' },
      { icon: Clock, text: 'Fragmented sleep is less restorative than continuous sleep. When possible, take one unbroken 4-hour block as your anchor sleep.' },
      { icon: Zap, text: 'Dehydration worsens fatigue. Keep water by your bedside, especially if breastfeeding, which increases fluid needs.' },
      { icon: Moon, text: 'Accept "good enough" sleep. Striving for perfection increases anxiety, which is one of the top barriers to falling asleep.' },
      { icon: Clock, text: 'Sleep deprivation affects emotional regulation. Prioritize sleep to stay patient and present with your children.' },
    ],
  },
  general: {
    title: 'Sleep Essentials',
    tips: [
      { icon: Clock, text: 'Aim for 7-9 hours of sleep. Consistency matters more than duration—keep regular bed and wake times.' },
      { icon: Moon, text: 'Create a dark, cool (65-72°F), quiet sleep environment. Darkness signals your body to produce melatonin.' },
      { icon: Smartphone, text: 'Stop screen use 30 minutes before bed. Blue light disrupts your natural sleep-wake cycle.' },
      { icon: Sun, text: 'Get 10-15 min of sunlight within the first hour of waking to boost daytime energy and nighttime sleep quality.' },
      { icon: Coffee, text: 'Caffeine has a half-life of 5-6 hours. A 3 PM coffee means half the caffeine is still active at 9 PM.' },
      { icon: Moon, text: 'Keep your bedroom for sleep only. Working or scrolling in bed weakens the mental association between bed and sleep.' },
      { icon: Clock, text: 'Going to bed and waking at the same time daily—even weekends—is the single most impactful sleep habit.' },
      { icon: Zap, text: 'A warm shower 1-2 hours before bed drops your core temperature afterward, triggering sleepiness naturally.' },
      { icon: Moon, text: 'Alcohol may help you fall asleep faster, but it disrupts REM sleep and causes more awakenings in the second half of the night.' },
      { icon: Sun, text: 'Avoid heavy meals within 3 hours of bedtime. Digestion raises body temperature and can cause acid reflux during sleep.' },
      { icon: Smartphone, text: 'If you can\'t sleep after 20 minutes, get up and do something calming in dim light. Return to bed when sleepy.' },
      { icon: Clock, text: 'Naps longer than 30 minutes can cause sleep inertia (grogginess) and may reduce your sleep drive at night.' },
      { icon: Moon, text: 'Magnesium-rich foods (nuts, seeds, leafy greens) support GABA production, a neurotransmitter that promotes sleep.' },
      { icon: Zap, text: 'Regular exercise improves sleep quality by 65%, but timing matters—finish vigorous exercise at least 3 hours before bed.' },
    ],
  },
};

// Expanded personalized recommendations based on goal (~14 performance-focused tips each)
const goalRecommendations: Record<string, { title: string; tips: { icon: React.ElementType; text: string }[] }> = {
  energy: {
    title: 'Tips for More Energy',
    tips: [
      { icon: Sun, text: 'Get 10-15 min of morning sunlight within 1 hour of waking to regulate your circadian rhythm and boost alertness.' },
      { icon: Dumbbell, text: 'Exercise increases energy more effectively than some sleep medications. Even a 10-min walk boosts circulation and endorphins.' },
      { icon: Coffee, text: 'Hydration is key—even 2% dehydration causes fatigue and brain fog. Aim for 8 glasses of water daily.' },
      { icon: Moon, text: 'A strategic 10-20 min power nap between 1-3 PM can recharge your energy without affecting nighttime sleep.' },
      { icon: Zap, text: 'Cold water exposure (even a 30-second cold blast in the shower) increases norepinephrine by 200-300%, boosting energy for hours.' },
      { icon: Clock, text: 'Align meals with your circadian rhythm: eat more in the morning and less at night to stabilize daily energy levels.' },
      { icon: Sun, text: 'Spending just 20 minutes in nature ("green exercise") reduces fatigue and improves vigor more than indoor exercise.' },
      { icon: Dumbbell, text: 'Brief movement breaks every 90 minutes prevent the afternoon energy crash. Stand, stretch, or walk for 2-3 minutes.' },
      { icon: Coffee, text: 'Delay your first coffee to 90 minutes after waking. This aligns caffeine with your natural cortisol dip for maximum effect.' },
      { icon: Zap, text: 'Iron deficiency is the most common nutrient deficiency causing fatigue. Include iron-rich foods like spinach and lentils.' },
      { icon: Moon, text: 'Deep breathing (4-7-8 technique) for 2 minutes activates your parasympathetic system, reducing fatigue-causing stress hormones.' },
      { icon: Clock, text: 'Consistent wake times regulate your cortisol awakening response—the natural energy boost that sets your daily rhythm.' },
      { icon: Sun, text: 'Vitamin D deficiency causes chronic fatigue. Get 15 minutes of direct sunlight or consider supplementation in winter.' },
      { icon: Dumbbell, text: 'Low-intensity movement like yoga or walking actually restores energy better than sitting still when you feel tired.' },
    ],
  },
  focus: {
    title: 'Tips for Better Focus',
    tips: [
      { icon: Clock, text: '7 hours of sleep is optimal for cognitive performance. Both too little and too much sleep impair concentration.' },
      { icon: Moon, text: 'During deep sleep, your brain clears metabolic waste and consolidates memories—essential for learning and attention.' },
      { icon: Target, text: 'Consistent sleep schedules improve cognitive flexibility and problem-solving. Keep the same bedtime on weekends.' },
      { icon: Coffee, text: 'Support focus with omega-3s, antioxidants, and B vitamins. Your diet directly fuels cognitive performance.' },
      { icon: Zap, text: 'REM sleep enhances creative problem-solving by 33%. Waking naturally (without an alarm) preserves late-morning REM cycles.' },
      { icon: Clock, text: 'Your brain\'s prefrontal cortex (focus center) is most impaired by sleep loss. Even 1 hour less reduces focus by 25%.' },
      { icon: Moon, text: 'Sleep spindles during light sleep transfer information from short-term to long-term memory. They peak in early morning sleep.' },
      { icon: Target, text: 'Work in 90-minute focus blocks that match your ultradian rhythm, then take a 15-20 minute break to reset attention.' },
      { icon: Sun, text: 'Morning bright light exposure increases dopamine receptor sensitivity, improving sustained attention throughout the day.' },
      { icon: Coffee, text: 'L-theanine (found in green tea) combined with caffeine improves focus without the jitteriness of coffee alone.' },
      { icon: Smartphone, text: 'Digital multitasking before bed fragments attention the next day. Single-task in the evening for better morning focus.' },
      { icon: Zap, text: 'Meditation for just 10 minutes before bed improves next-day attention by reducing mind-wandering during sleep onset.' },
      { icon: Clock, text: 'Chronically sleeping less than 6 hours shrinks gray matter in attention-related brain regions. The damage is cumulative.' },
      { icon: Target, text: 'Your peak focus window is 2-4 hours after waking. Schedule your most demanding cognitive tasks during this period.' },
    ],
  },
  performance: {
    title: 'Tips for Peak Performance',
    tips: [
      { icon: Zap, text: 'Sleep extension (adding 1-2 hours) dramatically improves reaction time, accuracy, and physical performance.' },
      { icon: Moon, text: 'Deep sleep triggers growth hormone release for tissue repair. Avoid alcohol which disrupts this crucial sleep stage.' },
      { icon: Clock, text: 'Maintain consistent sleep timing. Irregular sleep patterns impair attention, learning, and memory.' },
      { icon: Target, text: 'Pre-performance naps (20-30 min) can sharpen focus and improve reaction time when you need it most.' },
      { icon: Dumbbell, text: 'Athletes sleeping less than 7 hours are 1.7x more likely to get injured. Sleep is the best injury prevention tool.' },
      { icon: Zap, text: 'Two nights of recovery sleep can restore most cognitive performance, but physical performance takes 3-4 nights to fully recover.' },
      { icon: Moon, text: 'Sleep before learning improves information acquisition by 40%. Sleep after learning consolidates it by another 20-30%.' },
      { icon: Clock, text: 'Jet lag reduces performance by ~12% per time zone crossed. Adjust your light exposure schedule to adapt faster.' },
      { icon: Target, text: 'Heart rate variability (HRV) drops with poor sleep, indicating reduced readiness. Track HRV to optimize training intensity.' },
      { icon: Sun, text: 'Outdoor training in natural light improves sleep quality by 50% compared to indoor training under artificial light.' },
      { icon: Coffee, text: 'Strategic caffeine (3-6 mg/kg) 30-60 minutes before performance improves endurance by 2-4% and strength by 3-5%.' },
      { icon: Dumbbell, text: 'Cold-water immersion after evening training can reduce core temperature faster, shortening the time to fall asleep.' },
      { icon: Zap, text: 'Glycogen resynthesis occurs primarily during sleep. Poor sleep after hard training leaves energy stores depleted for the next day.' },
      { icon: Moon, text: 'Visualization and mental rehearsal before bed leverages sleep-dependent memory consolidation to improve motor skills by 20%.' },
    ],
  },
  consistency: {
    title: 'Tips for Sleep Consistency',
    tips: [
      { icon: Clock, text: 'Set a non-negotiable bedtime and wake time—even on weekends. Your body clock thrives on routine.' },
      { icon: Moon, text: 'Create a 30-min wind-down routine. Reading, stretching, or light meditation signals your body it\'s time to sleep.' },
      { icon: Sun, text: 'Morning light exposure anchors your circadian rhythm and makes it easier to fall asleep at the same time each night.' },
      { icon: Smartphone, text: 'Avoid screens, caffeine, and intense exercise within 2-3 hours of bedtime for easier, more predictable sleep.' },
      { icon: Clock, text: '"Social jet lag" (weekend schedule shifts) increases heart disease risk by 11% per hour of shift. Stay consistent.' },
      { icon: Moon, text: 'Dim all lights 1-2 hours before bed. Even 50 lux (a dim lamp) can delay melatonin release if it hits your eyes directly.' },
      { icon: Sun, text: 'Eating meals at consistent times helps synchronize your peripheral body clocks with your central circadian rhythm.' },
      { icon: Zap, text: 'Your body starts preparing for sleep 2 hours before your usual bedtime. Irregular schedules disrupt this preparation.' },
      { icon: Clock, text: 'It takes 1-2 weeks to fully adjust to a new sleep schedule. Make changes in 15-minute increments for easier adaptation.' },
      { icon: Moon, text: 'Use a consistent pre-sleep ritual (same order of activities). Rituals create cues that trigger automatic sleep readiness.' },
      { icon: Coffee, text: 'Regular caffeine intake at consistent times is less disruptive than sporadic use. Your body adapts to predictable patterns.' },
      { icon: Smartphone, text: 'Set a daily "screens off" alarm 30 minutes before your target bedtime. Automating the decision removes willpower from the equation.' },
      { icon: Sun, text: 'Weekend catch-up sleep doesn\'t reverse the metabolic damage of weekday sleep debt. Consistent daily sleep is healthier.' },
      { icon: Zap, text: 'Temperature consistency matters too. Your body expects the same thermal environment nightly—keep bedroom temp stable.' },
    ],
  },
};

// Daily Tips Card - rotates 2 sleep tips + 2 performance tips daily
function DailyTipsCard({ profile }: { profile: Profile }) {
  const sleepTips = (userTypeRecommendations[profile.user_type] || userTypeRecommendations.general).tips;
  const perfTips = (goalRecommendations[profile.goal] || goalRecommendations.energy).tips;

  const today = new Date().toDateString();
  const sleepIdx1 = getDailyTipIndex(today, sleepTips.length, 0);
  const sleepIdx2 = getDailyTipIndex(today, sleepTips.length, 1);
  const perfIdx1 = getDailyTipIndex(today, perfTips.length, 2);
  const perfIdx2 = getDailyTipIndex(today, perfTips.length, 3);

  // Avoid duplicates within each section
  const selectedSleep = [sleepTips[sleepIdx1]];
  if (sleepIdx2 !== sleepIdx1) {
    selectedSleep.push(sleepTips[sleepIdx2]);
  } else {
    selectedSleep.push(sleepTips[(sleepIdx2 + 1) % sleepTips.length]);
  }

  const selectedPerf = [perfTips[perfIdx1]];
  if (perfIdx2 !== perfIdx1) {
    selectedPerf.push(perfTips[perfIdx2]);
  } else {
    selectedPerf.push(perfTips[(perfIdx2 + 1) % perfTips.length]);
  }

  return (
    <AnimatedInsightCard index={0}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Today&apos;s Tips</h3>
        </div>

        {/* Sleep tips section */}
        <div className="mb-4">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Sleep</p>
          <AnimatedTipsList className="space-y-3">
            {selectedSleep.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{tip.text}</p>
                </div>
              );
            })}
          </AnimatedTipsList>
        </div>

        {/* Performance tips section */}
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Performance</p>
          <AnimatedTipsList className="space-y-3">
            {selectedPerf.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{tip.text}</p>
                </div>
              );
            })}
          </AnimatedTipsList>
        </div>
      </div>
    </AnimatedInsightCard>
  );
}

// Generate insights from sleep data
function generateInsights(sleepLogs: SleepLog[], profile: Profile) {
  if (sleepLogs.length < 3) return [];

  const insights = [];

  // Insight 1: Average sleep duration
  const avgDuration = Math.round(
    sleepLogs.reduce((acc, log) => acc + log.duration_minutes, 0) / sleepLogs.length
  );
  const goalMinutes = profile.sleep_goal_hours * 60;
  const durationDiff = avgDuration - goalMinutes;
  const durationTrend: 'up' | 'down' = durationDiff >= 0 ? 'up' : 'down';

  insights.push({
    icon: Clock,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Average Sleep Duration',
    value: formatDuration(avgDuration),
    description: durationDiff >= 0
      ? `You're getting ${formatDuration(Math.abs(durationDiff))} more than your goal!`
      : `You're ${formatDuration(Math.abs(durationDiff))} short of your ${profile.sleep_goal_hours}h goal.`,
    trend: durationTrend,
  });

  // Insight 2: Best sleep quality day
  const qualityByDay: Record<string, { total: number; count: number }> = {};
  sleepLogs.forEach((log) => {
    const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!qualityByDay[day]) {
      qualityByDay[day] = { total: 0, count: 0 };
    }
    qualityByDay[day].total += log.quality;
    qualityByDay[day].count += 1;
  });

  let bestDay = '';
  let bestAvg = 0;
  Object.entries(qualityByDay).forEach(([day, data]) => {
    const avg = data.total / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = day;
    }
  });

  if (bestDay) {
    insights.push({
      icon: Star,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
      title: 'Best Quality Sleep',
      value: bestDay,
      description: `You sleep best on ${bestDay}s with an average quality of ${bestAvg.toFixed(1)}/5.`,
      trend: 'neutral' as const,
    });
  }

  // Insight 3: Recovery trend
  const scores = sleepLogs.map((log) => calculateRecoveryScore(log, profile).score);
  const recentScores = scores.slice(0, Math.min(3, scores.length));
  const olderScores = scores.slice(Math.min(3, scores.length));

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const olderAvg = olderScores.length > 0
    ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
    : recentAvg;

  const scoreDiff = Math.round(recentAvg - olderAvg);
  const scoreTrend: 'up' | 'down' | 'neutral' = scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'neutral';

  insights.push({
    icon: Zap,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    title: 'Recovery Trend',
    value: scoreDiff > 0 ? `+${scoreDiff} points` : scoreDiff < 0 ? `${scoreDiff} points` : 'Stable',
    description: scoreDiff > 0
      ? 'Your recovery is improving! Keep up the good habits.'
      : scoreDiff < 0
      ? 'Your recovery has dipped. Focus on sleep consistency.'
      : 'Your recovery is holding steady.',
    trend: scoreTrend,
  });

  return insights;
}

export default async function InsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use admin client to bypass RLS for profile fetch (user is already authenticated)
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Get sleep logs for insights (more data for Pro users)
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  // Get checklist logs for correlation analysis (Pro feature)
  const { data: checklistLogs } = await supabase
    .from('checklist_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  const hasEnoughData = sleepLogs && sleepLogs.length >= 3;
  const insights = hasEnoughData ? generateInsights(sleepLogs, profile) : [];

  // Normalize is_pro to handle potential type coercion issues
  const isPro = profile.is_pro === true || profile.is_pro === 'true' || (profile.is_pro as unknown) === 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-text-secondary hover:text-text-primary transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Insights</h1>
              <p className="text-sm text-text-secondary">
                {isPro ? 'Pro Analytics' : hasEnoughData ? 'Based on your sleep data' : 'Need more data'}
              </p>
            </div>
          </div>
          {isPro && (
            <div className="flex items-center gap-1 bg-pro-accent/10 px-2 py-1 rounded-full">
              <Crown className="w-3.5 h-3.5 text-pro-accent" />
              <span className="text-xs font-medium text-pro-accent">PRO</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Personalized Recommendations (Always visible - Free) */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
              Personalized for You
            </h2>
            <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Free</span>
          </div>
          <DailyTipsCard profile={profile} />
        </div>

        {/* Not enough data state */}
        {!hasEnoughData && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Unlock Data Insights</h2>
            <p className="text-text-secondary mb-4">
              Log at least 3 nights of sleep to see trends and patterns in your sleep data.
            </p>
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-2 rounded-full ${
                    sleepLogs && sleepLogs.length >= i ? 'bg-warning' : 'bg-background'
                  }`}
                />
              ))}
            </div>
            <Link href="/dashboard/log">
              <Button>Log Sleep</Button>
            </Link>
          </div>
        )}

        {/* Insights */}
        {hasEnoughData && (
          <div className="space-y-4">
            {/* Free insights header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                Your Insights
              </h2>
              {!isPro && (
                <span className="text-xs text-text-muted">
                  {insights.length} of 3 (Free)
                </span>
              )}
            </div>

            {/* Free insights */}
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} index={index} />
            ))}

            {/* Pro insights and visualizations */}
            {isPro ? (
              <>
                {/* Pro Features Header */}
                <div className="flex items-center gap-2 mt-8 mb-2">
                  <Crown className="w-4 h-4 text-pro-accent" />
                  <h2 className="text-sm font-medium text-pro-accent uppercase tracking-wide">
                    Pro Analytics
                  </h2>
                </div>

                {/* Sleep Debt Tracker */}
                <SleepDebtTracker sleepLogs={sleepLogs} profile={profile} />

                {/* Correlation Analysis */}
                <CorrelationAnalysis
                  sleepLogs={sleepLogs}
                  checklistLogs={checklistLogs || []}
                  profile={profile}
                />

                {/* Optimal Bedtime */}
                <OptimalBedtime sleepLogs={sleepLogs} profile={profile} />

                {/* Weekly Report */}
                <WeeklyReport
                  sleepLogs={sleepLogs}
                  checklistLogs={checklistLogs || []}
                  profile={profile}
                />

                {/* Pro Visualizations (Client Component) */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-pro-accent" />
                    <h2 className="text-sm font-medium text-pro-accent uppercase tracking-wide">
                      Visual Analytics
                    </h2>
                  </div>
                  <ProInsightsClient
                    sleepLogs={sleepLogs}
                    checklistLogs={checklistLogs || []}
                    profile={profile}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Pro insights teaser for free users */}
                <div className="flex items-center gap-2 mt-8 mb-2">
                  <Crown className="w-4 h-4 text-pro-accent" />
                  <h2 className="text-sm font-medium text-pro-accent uppercase tracking-wide">
                    Pro Insights
                  </h2>
                </div>

                <LockedInsightCard
                  title="Sleep Debt Tracker"
                  description="See how much sleep you owe and when you'll recover."
                  index={0}
                />
                <LockedInsightCard
                  title="Correlation Analysis"
                  description="Discover what factors most affect your sleep quality."
                  index={1}
                />
                <LockedInsightCard
                  title="Optimal Bedtime"
                  description="Find your ideal bedtime for maximum recovery."
                  index={2}
                />
                <LockedInsightCard
                  title="Weekly Report"
                  description="Detailed breakdown of your sleep patterns each week."
                  index={3}
                />

                {/* Upgrade CTA */}
                <Link href="/dashboard/upgrade" className="block">
                  <div className="bg-gradient-to-br from-card to-card-hover rounded-xl border border-pro-accent/30 p-6 mt-6 hover:border-pro-accent/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-pro-accent" />
                      <span className="font-semibold text-pro-accent">Try Pro Free for 7 Days</span>
                    </div>
                    <p className="text-text-secondary text-sm mb-4">
                      Get advanced analytics, sleep debt tracking, and personalized recommendations.
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-text-primary font-bold">Free trial, then $2.99/mo</span>
                      <Button size="sm">Start Free Trial</Button>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
