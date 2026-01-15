import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
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
    const diff = log.duration_minutes - goalMinutes;
    totalDebt += diff;
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

// Correlation Analysis (Pro Feature)
function CorrelationAnalysis({ sleepLogs, checklistLogs, profile }: { sleepLogs: SleepLog[]; checklistLogs: ChecklistLog[]; profile: Profile }) {
  if (checklistLogs.length < 5) {
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
            <p className="text-sm text-text-muted">Log your pre-sleep checklist for at least 5 days to see correlations.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate correlations between checklist items and sleep quality
  const checklistItems = [
    { key: 'exercised', label: 'Exercise', icon: Dumbbell },
    { key: 'no_caffeine_after_2pm', label: 'No late caffeine', icon: Coffee },
    { key: 'no_alcohol', label: 'No alcohol', icon: Wine },
    { key: 'screens_off_30min', label: 'No screens', icon: Smartphone },
  ];

  const correlations = checklistItems.map((item) => {
    // Match checklist logs with sleep logs by date
    const matchedData: { checked: boolean; quality: number }[] = [];

    checklistLogs.forEach((cl) => {
      const sleepLog = sleepLogs.find((sl) => sl.date === cl.date);
      if (sleepLog) {
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
  if (sleepLogs.length < 7) {
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
            <p className="text-sm text-text-muted">Log at least 7 nights to calculate your optimal bedtime.</p>
          </div>
        </div>
      </div>
    );
  }

  // Find bedtimes that resulted in best quality sleep
  const bedtimeQuality = sleepLogs.map((log) => {
    const bedtime = new Date(log.bedtime);
    let hour = bedtime.getHours() + bedtime.getMinutes() / 60;
    if (hour < 12) hour += 24; // Normalize for after-midnight bedtimes

    return {
      hour,
      quality: log.quality,
      energy: log.energy,
      score: calculateRecoveryScore(log, profile).score,
    };
  });

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

  // Find best window
  let bestWindow = { hour: 22.5, avgScore: 0 };
  Object.entries(windows).forEach(([key, data]) => {
    if (data.count >= 2 && data.avgScore > bestWindow.avgScore) {
      bestWindow = { hour: parseFloat(key), avgScore: data.avgScore };
    }
  });

  // Format time
  const displayHour = bestWindow.hour > 24 ? bestWindow.hour - 24 : bestWindow.hour;
  const hours = Math.floor(displayHour);
  const minutes = Math.round((displayHour % 1) * 60);
  const meridian = hours >= 12 && hours < 24 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${meridian}`;

  // Calculate ideal wake time
  const idealWakeHour = displayHour + profile.sleep_goal_hours;
  const wakeHours = Math.floor(idealWakeHour > 24 ? idealWakeHour - 24 : idealWakeHour);
  const wakeMeridian = wakeHours >= 12 && wakeHours < 24 ? 'PM' : 'AM';
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

  const { data: profile } = await supabase
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
  // (database might return string 'true', number 1, etc.)
  const rawIsPro = profile.is_pro;
  const isPro = rawIsPro === true || rawIsPro === 'true' || (rawIsPro as unknown) === 1;

  // Debug: Log Pro status to server console
  console.log('=== PRO STATUS DEBUG ===');
  console.log('profile.is_pro (raw):', rawIsPro);
  console.log('profile.is_pro type:', typeof rawIsPro);
  console.log('isPro (normalized):', isPro);
  console.log('profile.pro_expires_at:', profile.pro_expires_at);
  console.log('========================');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
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
        {/* Debug info - remove after fixing */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-xs">
          <p className="font-bold text-yellow-500 mb-1">Debug Info (remove after fixing):</p>
          <p className="text-text-primary">Raw profile.is_pro: {JSON.stringify(profile.is_pro)} (type: {typeof profile.is_pro})</p>
          <p className="text-text-primary">Normalized isPro: {String(isPro)}</p>
          <p className="text-text-primary">pro_expires_at: {profile.pro_expires_at || 'null'}</p>
          <p className="text-text-primary">Visit /api/debug-pro to see raw API response</p>
        </div>

        {/* Not enough data state */}
        {!hasEnoughData && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Need more data</h2>
            <p className="text-text-secondary mb-4">
              Log at least 3 nights of sleep to unlock your personalized insights.
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
