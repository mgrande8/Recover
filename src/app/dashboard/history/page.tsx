import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Moon, History, Settings, Clock, Star, Zap, AlertCircle, FileText } from 'lucide-react';
import {
  calculateRecoveryScore,
  formatDuration,
  formatDate,
  getRecoveryColor,
} from '@/lib/utils';
import type { Profile, SleepLog } from '@/types';

// Bottom navigation component
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-safe">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted hover:text-text-secondary transition-colors"
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs">Today</span>
          </Link>
          <Link
            href="/dashboard/history"
            className="flex flex-col items-center gap-1 py-2 px-4 text-primary"
          >
            <History className="w-5 h-5" />
            <span className="text-xs font-medium">History</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex flex-col items-center gap-1 py-2 px-4 text-text-muted hover:text-text-secondary transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Stats summary component
function StatsSummary({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length === 0) return null;

  const scores = sleepLogs.map((log) => calculateRecoveryScore(log, profile).score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const avgDuration = Math.round(
    sleepLogs.reduce((acc, log) => acc + log.duration_minutes, 0) / sleepLogs.length
  );

  const avgQuality =
    (sleepLogs.reduce((acc, log) => acc + log.quality, 0) / sleepLogs.length).toFixed(1);

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <p className="text-2xl font-bold text-text-primary">{avgScore}</p>
        <p className="text-xs text-text-muted">Avg Score</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <p className="text-2xl font-bold text-text-primary">{formatDuration(avgDuration)}</p>
        <p className="text-xs text-text-muted">Avg Sleep</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <p className="text-2xl font-bold text-text-primary">{avgQuality}</p>
        <p className="text-xs text-text-muted">Avg Quality</p>
      </div>
    </div>
  );
}

// Sleep log card component
function SleepLogCard({ log, profile }: { log: SleepLog; profile: Profile }) {
  const recovery = calculateRecoveryScore(log, profile);
  const colorClass = getRecoveryColor(recovery.level);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-text-primary">{formatDate(log.date)}</p>
          <p className="text-sm text-text-secondary">{recovery.message.split('—')[0].trim()}</p>
        </div>
        <div className={`text-3xl font-bold ${colorClass}`}>{recovery.score}</div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-background rounded-lg py-2">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-primary">
            {formatDuration(log.duration_minutes)}
          </p>
          <p className="text-[10px] text-text-muted">Duration</p>
        </div>
        <div className="bg-background rounded-lg py-2">
          <div className="flex items-center justify-center mb-1">
            <Star className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-primary">{log.quality}/5</p>
          <p className="text-[10px] text-text-muted">Quality</p>
        </div>
        <div className="bg-background rounded-lg py-2">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-primary">{log.energy}/5</p>
          <p className="text-[10px] text-text-muted">Energy</p>
        </div>
        <div className="bg-background rounded-lg py-2">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-primary">{log.interruptions}</p>
          <p className="text-[10px] text-text-muted">Wake-ups</p>
        </div>
      </div>

      {log.notes && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-secondary">{log.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Get all sleep logs
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  const hasLogs = sleepLogs && sleepLogs.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-text-primary">Sleep History</h1>
          <p className="text-sm text-text-secondary">
            {hasLogs ? `${sleepLogs.length} nights logged` : 'No sleep logs yet'}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Empty state */}
        {!hasLogs && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No history yet</h2>
            <p className="text-text-secondary mb-6">
              Start logging your sleep to build your history and see patterns.
            </p>
            <Link
              href="/dashboard/log"
              className="text-primary hover:text-primary-hover font-medium"
            >
              Log your first night &rarr;
            </Link>
          </div>
        )}

        {/* History with data */}
        {hasLogs && (
          <>
            {/* Stats summary */}
            <StatsSummary sleepLogs={sleepLogs} profile={profile} />

            {/* Sleep log list */}
            <div className="space-y-4">
              {sleepLogs.map((log) => (
                <SleepLogCard key={log.id} log={log} profile={profile} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
