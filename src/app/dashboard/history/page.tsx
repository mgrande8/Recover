import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Moon, History, User, Clock, Star, Zap, AlertCircle, FileText, Pencil, CloudSun, Plus, Trash2, Plane, Frown, Thermometer, BedDouble, Wine, Dumbbell, Pill, Coffee, Smartphone, Tag } from 'lucide-react';
import { DeleteSleepLog } from '@/components/DeleteSleepLog';
import { Button } from '@/components/ui';
import {
  calculateRecoveryScore,
  formatDuration,
  formatDate,
  getRecoveryColor,
} from '@/lib/utils';
import type { Profile, SleepLog, SleepLogTag, SleepTag } from '@/types';

const tagConfig: Record<SleepTag, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  travel: { label: 'Travel', icon: Plane, color: 'text-primary', bg: 'bg-primary/10' },
  stress: { label: 'Stress', icon: Frown, color: 'text-danger', bg: 'bg-danger/10' },
  sick: { label: 'Sick', icon: Thermometer, color: 'text-warning', bg: 'bg-warning/10' },
  new_mattress: { label: 'New Bed', icon: BedDouble, color: 'text-success', bg: 'bg-success/10' },
  alcohol: { label: 'Alcohol', icon: Wine, color: 'text-danger', bg: 'bg-danger/10' },
  exercise: { label: 'Exercise', icon: Dumbbell, color: 'text-success', bg: 'bg-success/10' },
  medication: { label: 'Meds', icon: Pill, color: 'text-warning', bg: 'bg-warning/10' },
  caffeine: { label: 'Caffeine', icon: Coffee, color: 'text-warning', bg: 'bg-warning/10' },
  screen_time: { label: 'Screens', icon: Smartphone, color: 'text-danger', bg: 'bg-danger/10' },
  custom: { label: 'Other', icon: Tag, color: 'text-text-muted', bg: 'bg-card-hover' },
};

// Bottom navigation component
// Stats summary component
function StatsSummary({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  // Filter out naps for stats - only show night sleep averages
  const nightLogs = sleepLogs.filter((log) => !log.is_nap);
  const napCount = sleepLogs.length - nightLogs.length;

  if (nightLogs.length === 0) return null;

  const scores = nightLogs.map((log) => calculateRecoveryScore(log, profile).score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const avgDuration = Math.round(
    nightLogs.reduce((acc, log) => acc + log.duration_minutes, 0) / nightLogs.length
  );

  const avgQuality =
    (nightLogs.reduce((acc, log) => acc + log.quality, 0) / nightLogs.length).toFixed(1);

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
function SleepLogCard({ log, profile, tags }: { log: SleepLog; profile: Profile; tags: SleepLogTag[] }) {
  const recovery = calculateRecoveryScore(log, profile);
  const colorClass = getRecoveryColor(recovery.level);

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:bg-card-hover transition-all group relative">
      {/* Delete button - top right, always visible on mobile */}
      <div className="absolute top-2 right-2">
        <DeleteSleepLog logId={log.id} date={formatDate(log.date)} isNap={log.is_nap} />
      </div>

      <Link href={`/dashboard/log?date=${log.date}${log.is_nap ? '&nap=true' : ''}`} className="block">
        <div className="flex items-start justify-between mb-3 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary">{formatDate(log.date)}</p>
              {log.is_nap && (
                <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  <CloudSun className="w-3 h-3" />
                  Nap
                </span>
              )}
              <Pencil className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-text-secondary">
              {log.is_nap ? `${formatDuration(log.duration_minutes)} nap` : recovery.message.split('—')[0].trim()}
            </p>
          </div>
          {/* Only show recovery score for night sleep */}
          {!log.is_nap && (
            <div className={`text-3xl font-bold ${colorClass}`}>{recovery.score}</div>
          )}
        </div>

        {/* Stats grid - only for night sleep */}
        {!log.is_nap && (
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
        )}

        {/* Notes - only for night sleep */}
        {!log.is_nap && log.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
              <p className="text-sm text-text-secondary">{log.notes}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const config = tagConfig[t.tag];
              const TagIcon = config.icon;
              return (
                <span key={t.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                  <TagIcon className="w-3 h-3" />
                  {t.tag === 'custom' && t.custom_label ? t.custom_label : config.label}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-xs text-text-muted text-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          Tap to edit
        </p>
      </Link>
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

  // Get tags for all displayed logs
  const logIds = sleepLogs?.map((log) => log.id) || [];
  const { data: allTags } = logIds.length > 0
    ? await supabase
        .from('sleep_log_tags')
        .select('*')
        .in('sleep_log_id', logIds)
    : { data: [] };

  // Group tags by sleep_log_id
  const tagsByLogId: Record<string, SleepLogTag[]> = {};
  (allTags || []).forEach((tag: SleepLogTag) => {
    if (!tagsByLogId[tag.sleep_log_id]) tagsByLogId[tag.sleep_log_id] = [];
    tagsByLogId[tag.sleep_log_id].push(tag);
  });

  const hasLogs = sleepLogs && sleepLogs.length > 0;
  const nightCount = sleepLogs?.filter((log) => !log.is_nap).length || 0;
  const napCount = sleepLogs?.filter((log) => log.is_nap).length || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Sleep History</h1>
            <p className="text-sm text-text-secondary">
              {hasLogs
                ? `${nightCount} ${nightCount === 1 ? 'night' : 'nights'}${napCount > 0 ? ` + ${napCount} ${napCount === 1 ? 'nap' : 'naps'}` : ''} logged`
                : 'No sleep logs yet'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/log?nap=true">
              <Button size="sm" variant="outline">
                <CloudSun className="w-4 h-4 mr-1" />
                Nap
              </Button>
            </Link>
            <Link href="/dashboard/log">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Sleep
              </Button>
            </Link>
          </div>
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
                <SleepLogCard key={log.id} log={log} profile={profile} tags={tagsByLogId[log.id] || []} />
              ))}
            </div>
          </>
        )}
      </main>

    </div>
  );
}
