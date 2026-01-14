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
} from 'lucide-react';
import { Button } from '@/components/ui';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';
import type { Profile, SleepLog } from '@/types';

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

  // Get sleep logs for insights
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  const hasEnoughData = sleepLogs && sleepLogs.length >= 3;
  const insights = hasEnoughData ? generateInsights(sleepLogs, profile) : [];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Insights</h1>
            <p className="text-sm text-text-secondary">
              {hasEnoughData ? 'Based on your sleep data' : 'Need more data'}
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
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
              <span className="text-xs text-text-muted">
                {insights.length} of 3 (Free)
              </span>
            </div>

            {/* Free insights */}
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}

            {/* Pro insights teaser */}
            {!profile.is_pro && (
              <>
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
                <div className="bg-gradient-to-br from-card to-card-hover rounded-xl border border-pro-accent/30 p-6 mt-6">
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
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
