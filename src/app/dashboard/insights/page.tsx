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
  User,
  UtensilsCrossed,
  Thermometer,
  BedDouble,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';
import type { Profile, SleepLog, ChecklistLog } from '@/types';
import { ProInsightsClient } from './ProInsightsClient';

// Insight card component
function InsightCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  description,
  trend,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
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
  );
}

// Locked insight card for Pro features
function LockedInsightCard({ title, description }: { title: string; description: string }) {
  return (
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
  );
}

// Sleep Debt Tracker (Pro Feature)
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
  );
}

// Helper function to normalize date strings for comparison
function normalizeDate(dateStr: string): string {
  // Handle various date formats and return YYYY-MM-DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toISOString().split('T')[0];
}

// Correlation Analysis (Pro Feature)
function CorrelationAnalysis({ sleepLogs, checklistLogs, profile }: { sleepLogs: SleepLog[]; checklistLogs: ChecklistLog[]; profile: Profile }) {
  const requiredChecklists = 5;
  const currentCount = checklistLogs.length;
  const progress = Math.min(currentCount / requiredChecklists, 1);

  if (currentCount < requiredChecklists) {
    return (
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
  );
}

// Optimal Bedtime Calculator (Pro Feature)
function OptimalBedtime({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  const requiredLogs = 7;
  // Filter out naps for this calculation
  const nightSleepLogs = sleepLogs.filter((log) => !log.is_nap);
  const currentCount = nightSleepLogs.length;
  const progress = Math.min(currentCount / requiredLogs, 1);

  if (currentCount < requiredLogs) {
    return (
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
    // Filter out unreasonable bedtimes (before 6 PM or after 3 AM)
    // Reasonable range: 18 (6 PM) to 27 (3 AM)
    .filter((bq) => bq.hour >= 18 && bq.hour <= 27);

  if (bedtimeQuality.length < 5) {
    // Not enough reasonable bedtime data
    const needed = 5 - bedtimeQuality.length;
    return (
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
            <p className="text-xs text-text-muted">Log sleep with bedtimes between 6 PM - 3 AM for best results.</p>
          </div>
        </div>
      </div>
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

  // Find best window, preferring times closer to typical bedtime when scores are similar
  // Default to typical bedtime if no data
  let bestWindow = { hour: typicalBedtimeHour, avgScore: 0 };
  Object.entries(windows).forEach(([key, data]) => {
    const windowHour = parseFloat(key);
    // Require at least 2 data points for a window to be considered
    if (data.count >= 2) {
      // Calculate distance from typical bedtime (prefer closer times)
      const currentDistance = Math.abs(bestWindow.hour - typicalBedtimeHour);
      const newDistance = Math.abs(windowHour - typicalBedtimeHour);

      // Select this window if:
      // 1. Score is significantly better (more than 5 points)
      // 2. OR score is similar but closer to typical bedtime
      const scoreDiff = data.avgScore - bestWindow.avgScore;
      if (scoreDiff > 5 || (scoreDiff > -3 && newDistance < currentDistance)) {
        bestWindow = { hour: windowHour, avgScore: data.avgScore };
      }
    }
  });

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
            Based on your data, going to bed around {formattedTime} gives you the best recovery (avg score: {Math.round(bestWindow.avgScore)}).
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            <Sun className="w-3.5 h-3.5" />
            <span>Ideal wake time: {formattedWakeTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Weekly Report Summary (Pro Feature)
function WeeklyReport({ sleepLogs, checklistLogs, profile }: { sleepLogs: SleepLog[]; checklistLogs: ChecklistLog[]; profile: Profile }) {
  const thisWeek = sleepLogs.slice(0, 7);
  const lastWeek = sleepLogs.slice(7, 14);

  if (thisWeek.length < 3) {
    return (
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
  );
}

// Personalized recommendations based on user type
const userTypeRecommendations: Record<string, { title: string; tips: { icon: React.ElementType; text: string }[] }> = {
  athlete: {
    title: 'Athlete Sleep Guide',
    tips: [
      { icon: Clock, text: 'Aim for 8-10 hours of sleep. Studies show elite athletes who increased sleep to 8.5h improved sprint speed by 4% and reaction time by 12%.' },
      { icon: Moon, text: 'Take strategic 20-30 min naps before training or competition to enhance alertness and power output.' },
      { icon: Zap, text: 'Sleep drives growth hormone and testosterone release essential for muscle repair. Even one poor night can reduce testosterone by 25%.' },
      { icon: Sun, text: 'Get morning sunlight within 1 hour of waking to regulate your circadian rhythm and improve sleep quality.' },
    ],
  },
  professional: {
    title: 'Professional Sleep Guide',
    tips: [
      { icon: Clock, text: 'Use the 8-8-8 framework: 8 hours work, 8 hours personal time, 8 hours sleep for optimal productivity.' },
      { icon: Target, text: 'Sleep improves focus, decision-making, and memory. Workers with sufficient sleep have faster reaction times and fewer mistakes.' },
      { icon: Coffee, text: 'Limit caffeine after 2 PM. A 15-20 min power nap between 1-3 PM can boost afternoon alertness.' },
      { icon: Smartphone, text: 'Avoid screens 30-60 min before bed. Blue light suppresses melatonin and delays sleep onset.' },
    ],
  },
  parent: {
    title: 'Parent Sleep Survival Guide',
    tips: [
      { icon: Moon, text: 'Nap when baby naps. Even 20-30 min power naps can significantly boost your alertness and mood.' },
      { icon: Clock, text: 'Split night duties with your partner if possible. Uninterrupted sleep blocks are more restorative than fragmented sleep.' },
      { icon: Zap, text: 'Protein-rich snacks with complex carbs (like peanut butter toast) provide sustained energy during night feeds.' },
      { icon: Sun, text: 'Get outside daily, even for 10 minutes. Sunlight helps regulate your body clock and improves mental health.' },
    ],
  },
  general: {
    title: 'Sleep Essentials',
    tips: [
      { icon: Clock, text: 'Aim for 7-9 hours of sleep. Consistency matters more than duration—keep regular bed and wake times.' },
      { icon: Moon, text: 'Create a dark, cool (65-72°F), quiet sleep environment. Darkness signals your body to produce melatonin.' },
      { icon: Smartphone, text: 'Stop screen use 30 minutes before bed. Blue light disrupts your natural sleep-wake cycle.' },
      { icon: Sun, text: 'Get 10-15 min of sunlight within the first hour of waking to boost daytime energy and nighttime sleep quality.' },
    ],
  },
};

// Personalized recommendations based on goal
const goalRecommendations: Record<string, { title: string; tips: { icon: React.ElementType; text: string }[] }> = {
  energy: {
    title: 'Tips for More Energy',
    tips: [
      { icon: Sun, text: 'Get 10-15 min of morning sunlight within 1 hour of waking to regulate your circadian rhythm and boost alertness.' },
      { icon: Dumbbell, text: 'Exercise increases energy more effectively than some sleep medications. Even a 10-min walk boosts circulation and endorphins.' },
      { icon: Coffee, text: 'Hydration is key—even 2% dehydration causes fatigue and brain fog. Aim for 8 glasses of water daily.' },
      { icon: Moon, text: 'A strategic 10-20 min power nap between 1-3 PM can recharge your energy without affecting nighttime sleep.' },
    ],
  },
  focus: {
    title: 'Tips for Better Focus',
    tips: [
      { icon: Clock, text: '7 hours of sleep is optimal for cognitive performance. Both too little and too much sleep impair concentration.' },
      { icon: Moon, text: 'During deep sleep, your brain clears metabolic waste and consolidates memories—essential for learning and attention.' },
      { icon: Target, text: 'Consistent sleep schedules improve cognitive flexibility and problem-solving. Keep the same bedtime on weekends.' },
      { icon: Coffee, text: 'Support focus with omega-3s, antioxidants, and B vitamins. Your diet directly fuels cognitive performance.' },
    ],
  },
  performance: {
    title: 'Tips for Peak Performance',
    tips: [
      { icon: Zap, text: 'Sleep extension (adding 1-2 hours) dramatically improves reaction time, accuracy, and physical performance.' },
      { icon: Moon, text: 'Deep sleep triggers growth hormone release for tissue repair. Avoid alcohol which disrupts this crucial sleep stage.' },
      { icon: Clock, text: 'Maintain consistent sleep timing. Irregular sleep patterns impair attention, learning, and memory.' },
      { icon: Target, text: 'Pre-performance naps (20-30 min) can sharpen focus and improve reaction time when you need it most.' },
    ],
  },
  consistency: {
    title: 'Tips for Sleep Consistency',
    tips: [
      { icon: Clock, text: 'Set a non-negotiable bedtime and wake time—even on weekends. Your body clock thrives on routine.' },
      { icon: Moon, text: 'Create a 30-min wind-down routine. Reading, stretching, or light meditation signals your body it\'s time to sleep.' },
      { icon: Sun, text: 'Morning light exposure anchors your circadian rhythm and makes it easier to fall asleep at the same time each night.' },
      { icon: Smartphone, text: 'Avoid screens, caffeine, and intense exercise within 2-3 hours of bedtime for easier, more predictable sleep.' },
    ],
  },
};

// User Type Insights Component (Free)
function UserTypeInsights({ profile }: { profile: Profile }) {
  const recommendations = userTypeRecommendations[profile.user_type] || userTypeRecommendations.general;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">{recommendations.title}</h3>
      </div>
      <div className="space-y-3">
        {recommendations.tips.map((tip, index) => {
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
      </div>
    </div>
  );
}

// Goal-Based Insights Component (Free)
function GoalInsights({ profile }: { profile: Profile }) {
  const recommendations = goalRecommendations[profile.goal] || goalRecommendations.energy;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-success" />
        <h3 className="font-semibold text-text-primary">{recommendations.title}</h3>
      </div>
      <div className="space-y-3">
        {recommendations.tips.map((tip, index) => {
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
      </div>
    </div>
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
    <div className="min-h-screen bg-background pb-8">
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
          <UserTypeInsights profile={profile} />
          <GoalInsights profile={profile} />
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
              <InsightCard key={index} {...insight} />
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
                />
                <LockedInsightCard
                  title="Correlation Analysis"
                  description="Discover what factors most affect your sleep quality."
                />
                <LockedInsightCard
                  title="Optimal Bedtime"
                  description="Find your ideal bedtime for maximum recovery."
                />
                <LockedInsightCard
                  title="Weekly Report"
                  description="Detailed breakdown of your sleep patterns each week."
                />

                {/* Upgrade CTA */}
                <Link href="/dashboard/upgrade" className="block">
                  <div className="bg-gradient-to-br from-card to-card-hover rounded-xl border border-pro-accent/30 p-6 mt-6 hover:border-pro-accent/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-pro-accent" />
                      <span className="font-semibold text-pro-accent">Unlock Pro Insights</span>
                    </div>
                    <p className="text-text-secondary text-sm mb-4">
                      Get advanced analytics, sleep debt tracking, and personalized recommendations.
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-text-primary font-bold">$4.99/mo</span>
                      <Button size="sm">Upgrade to Pro</Button>
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
