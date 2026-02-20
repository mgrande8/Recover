import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  Moon,
  Plus,
  ChevronRight,
  ClipboardCheck,
  CloudSun,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  calculateRecoveryScore,
  formatDuration,
  formatDate,
  getRecoveryColor,
  getRecoveryBgColor,
  getRecoveryLevel,
  getTodayDate,
  checkIsPro,
} from '@/lib/utils';
import type { Profile, SleepLog, ChecklistLog } from '@/types';
import { DashboardProCharts } from '@/components/DashboardProCharts';
import { ShareStats } from '@/components/ShareStats';
import { ClientGreeting } from '@/components/ClientGreeting';
import { ReviewPrompt } from '@/components/ReviewPrompt';
import { MilestoneReport } from '@/components/MilestoneReport';
import { AnimatedRecoveryCard } from '@/components/AnimatedRecoveryCard';
import { AnimatedStreakWidget, AnimatedWeeklyTrend, AnimatedCard, AnimatedListItem } from '@/components/AnimatedWidgets';
import { DashboardTip } from '@/components/DashboardTip';

// Recovery Score display component (now uses animated client component)
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
    <AnimatedRecoveryCard
      score={recovery.score}
      level={recovery.level}
      message={recovery.message}
      duration={formatDuration(sleepLog.duration_minutes)}
      quality={sleepLog.quality}
      energy={sleepLog.energy}
      colorClass={colorClass}
      bgColorClass={bgColorClass}
    />
  );
}

// Streak widget - now uses animated version directly

// Weekly trend - now uses animated version
function WeeklyTrend({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 2) return null;

  const scores = sleepLogs.map((log) => calculateRecoveryScore(log, profile).score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const latestScore = scores[0];
  const previousScore = scores[1];
  const trend = latestScore - previousScore;

  return <AnimatedWeeklyTrend avgScore={avgScore} trend={trend} />;
}

// Checklist widget component with animation
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
    <AnimatedCard delay={0.2}>
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
    </AnimatedCard>
  );
}

// Recent logs list with staggered animations
function RecentLogs({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  // Filter out naps - this section is for night sleep only
  const nightLogs = sleepLogs.filter((log) => !log.is_nap);

  if (nightLogs.length <= 1) return null;

  const recentLogs = nightLogs.slice(1, 4);

  return (
    <AnimatedCard delay={0.5}>
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
          {recentLogs.map((log, index) => {
            const recovery = calculateRecoveryScore(log, profile);
            const colorClass = getRecoveryColor(recovery.level);

            return (
              <AnimatedListItem key={log.id} index={index}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-medium">{formatDate(log.date)}</p>
                    <p className="text-sm text-text-muted">{formatDuration(log.duration_minutes)}</p>
                  </div>
                  <div className={`text-2xl font-bold ${colorClass}`}>{recovery.score}</div>
                </div>
              </AnimatedListItem>
            );
          })}
        </div>
      </div>
    </AnimatedCard>
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

  // Use admin client for profile to ensure Pro status shows immediately after purchase
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Get sleep logs (up to 365 for milestone reports)
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(365);

  // Count total unique days tracked (for milestone reports)
  const nightLogs = sleepLogs?.filter((log) => !log.is_nap) || [];
  const totalDaysTracked = nightLogs.length;

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

  const userName = profile?.name || profile?.email?.split('@')[0] || 'there';

  // Check Pro status with expiration validation
  const isPro = checkIsPro(profile);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* App Store review prompt - shows at 7+ day streak */}
      <ReviewPrompt currentStreak={currentStreak} />

      {/* Milestone report - shows at 30, 60, 90, 180, 365 days */}
      {hasLogs && (
        <MilestoneReport
          sleepLogs={sleepLogs || []}
          profile={profile}
          totalDaysTracked={totalDaysTracked}
        />
      )}

      {/* Header */}
      <header className="bg-card border-b border-border pt-safe">
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
            <Link href="/dashboard/log?nap=true">
              <Button size="sm" variant="outline">
                <CloudSun className="w-4 h-4 mr-1" />
                Nap
              </Button>
            </Link>
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
          <ClientGreeting name={userName} />
          <p className="text-text-secondary">
            {hasLogs
              ? `Here's your recovery from last night.`
              : "Let's log your first night of sleep."}
          </p>
        </div>

        {/* Recovery-based daily tip */}
        {hasLogs && latestLog && (
          <DashboardTip level={calculateRecoveryScore(latestLog, profile).level} />
        )}

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

            {/* Checklist widget */}
            <ChecklistWidget checklist={checklist} />

            {/* Free trial banner for non-Pro users */}
            {!isPro && (
              <AnimatedCard delay={0.3}>
                <Link href="/dashboard/upgrade" className="block">
                  <div className="bg-gradient-to-r from-pro-accent/15 to-primary/10 rounded-xl border border-pro-accent/25 p-4 hover:border-pro-accent/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pro-accent/15 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-pro-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">Try Pro free for 7 days</p>
                          <p className="text-sm text-text-secondary">Advanced insights, sleep debt tracking, and more</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-pro-accent flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              </AnimatedCard>
            )}

            {/* Streak widget */}
            <AnimatedStreakWidget currentStreak={currentStreak} longestStreak={longestStreak} />

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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-20">
        <Link href="/dashboard/log?nap=true">
          <button className="w-14 h-14 bg-warning rounded-full flex items-center justify-center shadow-lg hover:bg-warning/90 transition-colors">
            <CloudSun className="w-6 h-6 text-background" />
          </button>
        </Link>
        <Link href="/dashboard/log">
          <button className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </button>
        </Link>
      </div>

    </div>
  );
}
