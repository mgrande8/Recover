import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  ArrowLeft,
  Clock,
  Star,
  Zap,
  Target,
  Battery,
  TrendingUp,
  TrendingDown,
  Calendar,
  Crown,
  Lock,
} from 'lucide-react';
import { formatDuration, checkIsPro } from '@/lib/utils';
import type { MonthlyReport, MonthlyReportStats } from '@/types';
import { MonthlyReportView } from '@/components/MonthlyReportView';

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-danger/10 text-danger',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-success/10 text-success',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  const isPro = checkIsPro(profile);

  // Fetch the report
  const { data: report } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!report) notFound();

  const typedReport = report as MonthlyReport;
  const stats = typedReport.stats;
  const comparison = typedReport.comparison;

  const periodStart = new Date(typedReport.period_start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const periodEnd = new Date(typedReport.period_end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard/insights"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">30-Day Report</h1>
            <p className="text-sm text-text-secondary">
              {periodStart} — {periodEnd}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{stats.avgRecoveryScore}</p>
            <p className="text-xs text-text-muted">Avg Recovery</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{formatDuration(stats.avgDuration)}</p>
            <p className="text-xs text-text-muted">Avg Duration</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Star className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{stats.avgQuality}/5</p>
            <p className="text-xs text-text-muted">Avg Quality</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Calendar className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{stats.consistencyScore}</p>
            <p className="text-xs text-text-muted">Consistency</p>
          </div>
        </div>

        {/* Pro-gated content */}
        {isPro ? (
          <>
            {/* Sleep Debt */}
            <div className={`bg-card rounded-xl border border-border p-4 ${
              stats.sleepDebtHours >= 0 ? 'border-success/30' : 'border-danger/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stats.sleepDebtHours >= 0 ? 'bg-success/10' : 'bg-danger/10'
                }`}>
                  <Battery className={`w-6 h-6 ${stats.sleepDebtHours >= 0 ? 'text-success' : 'text-danger'}`} />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Sleep Debt</p>
                  <p className={`text-2xl font-bold ${stats.sleepDebtHours >= 0 ? 'text-success' : 'text-danger'}`}>
                    {stats.sleepDebtHours >= 0 ? '+' : ''}{stats.sleepDebtHours}h
                  </p>
                  <p className="text-xs text-text-muted">
                    {stats.sleepDebtHours >= 0
                      ? 'Surplus over the period'
                      : 'Behind your sleep goal'}
                  </p>
                </div>
              </div>
            </div>

            {/* Best / Worst Day */}
            <div className="flex gap-3">
              <div className="flex-1 bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                <p className="text-xs text-success mb-1">Best Night</p>
                <p className="text-2xl font-bold text-success">{stats.bestDay.score}</p>
                <p className="text-xs text-text-muted">
                  {new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex-1 bg-danger/5 border border-danger/20 rounded-xl p-4 text-center">
                <p className="text-xs text-danger mb-1">Worst Night</p>
                <p className="text-2xl font-bold text-danger">{stats.worstDay.score}</p>
                <p className="text-xs text-text-muted">
                  {new Date(stats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Day of Week Breakdown */}
            {Object.keys(stats.dayOfWeekScores).length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Day of Week Scores</h3>
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                    const score = stats.dayOfWeekScores[day];
                    if (score === undefined) return (
                      <div key={day} className="text-center">
                        <p className="text-xs text-text-muted mb-1">{day}</p>
                        <p className="text-sm text-text-muted">—</p>
                      </div>
                    );
                    return (
                      <div key={day} className="text-center">
                        <p className="text-xs text-text-muted mb-1">{day}</p>
                        <p className={`text-sm font-bold ${
                          score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-danger'
                        }`}>{score}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checklist Correlations */}
            {stats.checklistCorrelations.filter((c) => c.impact !== 0).length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Habit Impact</h3>
                <div className="space-y-3">
                  {stats.checklistCorrelations.slice(0, 4).filter((c) => c.impact !== 0).map((corr) => {
                    const isPositive = corr.impact > 0;
                    const impactPercent = Math.abs(corr.impact / 5 * 100);
                    return (
                      <div key={corr.item} className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">{corr.label}</p>
                          <div className="h-1.5 bg-background rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${isPositive ? 'bg-success' : 'bg-danger'} transition-all`}
                              style={{ width: `${Math.min(impactPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                          {isPositive ? '+' : ''}{corr.impact.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Month-over-month comparison */}
            {comparison && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">vs Previous Month</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {comparison.scoreDelta >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-danger" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${comparison.scoreDelta >= 0 ? 'text-success' : 'text-danger'}`}>
                      {comparison.scoreDelta >= 0 ? '+' : ''}{comparison.scoreDelta}
                    </p>
                    <p className="text-xs text-text-muted">Score</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {comparison.durationDelta >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-danger" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${comparison.durationDelta >= 0 ? 'text-success' : 'text-danger'}`}>
                      {comparison.durationDelta >= 0 ? '+' : ''}{Math.round(comparison.durationDelta)}m
                    </p>
                    <p className="text-xs text-text-muted">Duration</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {comparison.consistencyDelta >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-danger" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${comparison.consistencyDelta >= 0 ? 'text-success' : 'text-danger'}`}>
                      {comparison.consistencyDelta >= 0 ? '+' : ''}{comparison.consistencyDelta}
                    </p>
                    <p className="text-xs text-text-muted">Consistency</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {stats.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Recommendations</h3>
                {stats.recommendations.map((rec, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-text-primary text-sm">{rec.title}</p>
                      <PriorityBadge priority={rec.priority} />
                    </div>
                    <p className="text-sm text-text-secondary">{rec.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Share button */}
            <MonthlyReportView report={typedReport} />
          </>
        ) : (
          <>
            {/* Locked content for free users */}
            <div className="bg-card rounded-xl border border-border p-4 opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-card-hover flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-text-secondary">Full Report Analysis</p>
                    <span className="text-xs bg-pro-accent/20 text-pro-accent px-2 py-0.5 rounded-full font-medium">
                      PRO
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">
                    Upgrade to Pro to unlock sleep debt tracking, habit correlations, day-of-week analysis, and personalized recommendations.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/dashboard/upgrade" className="block">
              <div className="bg-gradient-to-br from-card to-card-hover rounded-xl border border-pro-accent/30 p-6 hover:border-pro-accent/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-pro-accent" />
                  <span className="font-semibold text-pro-accent">Unlock Full Report</span>
                </div>
                <p className="text-text-secondary text-sm">
                  Get the complete analysis with recommendations and month-over-month comparisons.
                </p>
              </div>
            </Link>
          </>
        )}

        {/* Footer info */}
        <div className="text-center">
          <p className="text-xs text-text-muted">
            {stats.nightsLogged} nights logged over {stats.totalPeriodDays} days
          </p>
        </div>
      </main>
    </div>
  );
}
