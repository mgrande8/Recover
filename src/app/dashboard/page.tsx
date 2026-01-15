import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Moon,
  Plus,
  History,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Star,
  Zap,
  ChevronRight,
  ClipboardCheck,
  Lightbulb,
  Check,
  Flame,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  calculateRecoveryScore,
  formatDuration,
  formatDate,
  getRecoveryColor,
  getRecoveryBgColor,
  getTodayDate,
} from '@/lib/utils';
import type { Profile, SleepLog, ChecklistLog } from '@/types';
import { DashboardProCharts } from '@/components/DashboardProCharts';
import { ShareStats } from '@/components/ShareStats';

// Navigation component
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-safe">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 py-2 px-4 text-primary"
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs font-medium">Today</span>
          </Link>
          <Link
            href="/dashboard/history"
            className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted hover:text-text-secondary transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="text-xs">History</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted hover:text-text-secondary transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Recovery Score display component
function RecoveryScoreCard({
  sleepLog,
  profile,
}: {
  sleepLog: SleepLog;
  profile: Profile;
}) {
  const recovery = calculateRecoveryScore(sleepLog, profile);
  const colorClass = getRecoveryColor(recovery.level);
  const bgColorClass = getRecoveryBgColor(recovery.level);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="text-center mb-6">
        <p className="text-text-secondary text-sm uppercase tracking-wide mb-2">
          Recovery Score
        </p>
        <div className={`text-7xl font-bold ${colorClass} mb-2`}>{recovery.score}</div>
        <p className="text-text-primary font-medium">{recovery.message.split('—')[0].trim()}</p>
        <p className="text-text-secondary text-sm">{recovery.message.split('—')[1]?.trim()}</p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-background rounded-full overflow-hidden mb-6">
        <div
          className={`h-full ${bgColorClass} transition-all duration-500`}
          style={{ width: `${recovery.score}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-text-muted" />
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {formatDuration(sleepLog.duration_minutes)}
          </p>
          <p className="text-xs text-text-muted">Duration</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-4 h-4 text-text-muted" />
          </div>
          <p className="text-lg font-semibold text-text-primary">{sleepLog.quality}/5</p>
          <p className="text-xs text-text-muted">Quality</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-text-muted" />
          </div>
          <p className="text-lg font-semibold text-text-primary">{sleepLog.energy}/5</p>
          <p className="text-xs text-text-muted">Energy</p>
        </div>
      </div>
    </div>
  );
}

// Streak widget component
function StreakWidget({ currentStreak, longestStreak }: { currentStreak: number; longestStreak: number }) {
  if (currentStreak === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Current Streak</p>
            <p className="text-2xl font-bold text-text-primary">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</p>
          </div>
        </div>
        {longestStreak > currentStreak && (
          <div className="text-right">
            <p className="text-xs text-text-muted">Best</p>
            <p className="text-sm font-medium text-text-secondary">{longestStreak} days</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Weekly trend component
function WeeklyTrend({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 2) return null;

  const scores = sleepLogs.map((log) => calculateRecoveryScore(log, profile).score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const latestScore = scores[0];
  const previousScore = scores[1];
  const trend = latestScore - previousScore;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-text-muted';

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">7-day average</p>
          <p className="text-2xl font-bold text-text-primary">{avgScore}</p>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-5 h-5" />
          <span className="font-medium">{trend > 0 ? '+' : ''}{trend}</span>
        </div>
      </div>
    </div>
  );
}

// Checklist widget component
function ChecklistWidget({ checklist }: { checklist: ChecklistLog | null }) {
  const checklistItems = [
    'exercised',
    'no_caffeine_after_2pm',
    'no_alcohol',
    'no_heavy_meal',
    'room_dark',
    'room_cool',
    'screens_off_30min',
    'phone_not_in_bed',
  ];

  const checkedCount = checklist
    ? checklistItems.filter((key) => checklist[key as keyof ChecklistLog] === true).length
    : 0;
  const totalItems = checklistItems.length;
  const percentage = Math.round((checkedCount / totalItems) * 100);

  return (
    <Link href="/dashboard/checklist" className="block">
      <div className="bg-card rounded-xl border border-border p-4 hover:bg-card-hover transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Pre-Sleep Checklist</p>
              <p className="text-sm text-text-secondary">
                {checkedCount === 0 ? 'Not started' : `${checkedCount}/${totalItems} completed`}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted" />
        </div>
        <div className="h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              percentage >= 75 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

// Insights teaser component
function InsightsTeaser({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 3) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-medium text-text-primary">Insights</p>
            <p className="text-sm text-text-secondary">Log 3+ nights to unlock</p>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                sleepLogs.length >= i ? 'bg-warning' : 'bg-background'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Calculate a simple insight
  const avgQuality = sleepLogs.reduce((acc, log) => acc + log.quality, 0) / sleepLogs.length;
  const qualityTrend = avgQuality >= 3.5 ? 'improving' : 'needs attention';

  return (
    <Link href="/dashboard/insights" className="block">
      <div className="bg-card rounded-xl border border-border p-4 hover:bg-card-hover transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Insights</p>
              <p className="text-sm text-text-secondary">3 insights available</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted" />
        </div>
        <p className="text-sm text-text-secondary mt-2">
          Your sleep quality is {qualityTrend}. Tap to see more insights.
        </p>
      </div>
    </Link>
  );
}

// Recent logs list
function RecentLogs({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length <= 1) return null;

  const recentLogs = sleepLogs.slice(1, 4);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-medium text-text-primary">Recent Nights</h3>
        <Link
          href="/dashboard/history"
          className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {recentLogs.map((log) => {
          const recovery = calculateRecoveryScore(log, profile);
          const colorClass = getRecoveryColor(recovery.level);

          return (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">{formatDate(log.date)}</p>
                <p className="text-sm text-text-muted">{formatDuration(log.duration_minutes)}</p>
              </div>
              <div className={`text-2xl font-bold ${colorClass}`}>{recovery.score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
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

  // Get recent sleep logs (14 days for Pro charts)
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  // Get today's checklist
  const today = getTodayDate();
  const { data: checklist } = await supabase
    .from('checklist_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  // Get user streak
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', user.id)
    .single();

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;

  const hasLogs = sleepLogs && sleepLogs.length > 0;
  const latestLog = hasLogs ? sleepLogs[0] : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = profile?.name || profile?.email?.split('@')[0] || 'there';

  // Normalize is_pro to handle potential type coercion issues from database
  const isPro = profile.is_pro === true || profile.is_pro === 'true' || profile.is_pro === 1;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-text-primary">Recover</span>
          </div>
          <div className="flex items-center gap-2">
            {hasLogs && (
              <ShareStats
                sleepLogs={sleepLogs || []}
                profile={profile}
                currentStreak={currentStreak}
              />
            )}
            <Link href="/dashboard/log">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Log Sleep
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome message */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            {getGreeting()}, {userName}!
          </h1>
          <p className="text-text-secondary">
            {hasLogs
              ? `Here's your recovery from last night.`
              : "Let's log your first night of sleep."}
          </p>
        </div>

        {/* Empty state */}
        {!hasLogs && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No sleep data yet</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Start tracking your sleep to see your Recovery Score and personalized insights.
            </p>
            <Link href="/dashboard/log">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Log Last Night&apos;s Sleep
              </Button>
            </Link>
          </div>
        )}

        {/* Dashboard with data */}
        {hasLogs && latestLog && (
          <>
            {/* Recovery Score */}
            <RecoveryScoreCard sleepLog={latestLog} profile={profile} />

            {/* Quick actions row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Checklist widget */}
              <ChecklistWidget checklist={checklist} />

              {/* Insights teaser */}
              <InsightsTeaser sleepLogs={sleepLogs} profile={profile} />
            </div>

            {/* Streak widget */}
            <StreakWidget currentStreak={currentStreak} longestStreak={longestStreak} />

            {/* Weekly trend */}
            <WeeklyTrend sleepLogs={sleepLogs} profile={profile} />

            {/* Pro Analytics Charts */}
            {isPro && (
              <DashboardProCharts sleepLogs={sleepLogs} profile={profile} />
            )}

            {/* Recent logs */}
            <RecentLogs sleepLogs={sleepLogs} profile={profile} />

            {/* Quick log button */}
            <Link href="/dashboard/log" className="block">
              <Button variant="outline" className="w-full">
                <Plus className="w-5 h-5 mr-2" />
                Log Another Night
              </Button>
            </Link>
          </>
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
