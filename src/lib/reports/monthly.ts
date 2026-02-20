import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateRecoveryScore } from '@/lib/utils';
import type {
  SleepLog,
  ChecklistLog,
  Profile,
  MonthlyReportStats,
  MonthlyReportComparison,
  MonthlyReport,
  SleepLogTag,
} from '@/types';

const CHECKLIST_ITEMS = [
  { key: 'exercised', label: 'Exercise' },
  { key: 'no_caffeine_after_2pm', label: 'No late caffeine' },
  { key: 'no_alcohol', label: 'No alcohol' },
  { key: 'no_heavy_meal', label: 'Light dinner' },
  { key: 'room_dark', label: 'Dark room' },
  { key: 'room_cool', label: 'Cool room' },
  { key: 'screens_off_30min', label: 'No screens' },
  { key: 'phone_not_in_bed', label: 'Phone away' },
] as const;

function normalizeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toISOString().split('T')[0];
}

export function computeMonthlyStats(
  sleepLogs: SleepLog[],
  checklistLogs: ChecklistLog[],
  profile: Profile,
  tags: SleepLogTag[] = []
): MonthlyReportStats {
  const nightLogs = sleepLogs.filter((log) => !log.is_nap);

  // Basic averages
  const avgDuration = nightLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / nightLogs.length;
  const avgQuality = nightLogs.reduce((sum, log) => sum + log.quality, 0) / nightLogs.length;
  const avgEnergy = nightLogs.reduce((sum, log) => sum + log.energy, 0) / nightLogs.length;

  // Recovery scores
  const scoredLogs = nightLogs.map((log) => ({
    ...log,
    score: calculateRecoveryScore(log, profile).score,
  }));
  const avgRecoveryScore = Math.round(
    scoredLogs.reduce((sum, log) => sum + log.score, 0) / scoredLogs.length
  );

  // Best and worst days
  const best = scoredLogs.reduce((best, log) => (log.score > best.score ? log : best), scoredLogs[0]);
  const worst = scoredLogs.reduce((worst, log) => (log.score < worst.score ? log : worst), scoredLogs[0]);

  // Sleep debt
  const goalMinutes = profile.sleep_goal_hours * 60;
  let totalDebt = 0;
  sleepLogs.forEach((log) => {
    if (log.is_nap) {
      totalDebt += log.duration_minutes;
    } else {
      totalDebt += log.duration_minutes - goalMinutes;
    }
  });
  const sleepDebtHours = totalDebt / 60;

  // Consistency score (based on bedtime standard deviation)
  const bedtimeMinutes = nightLogs.map((log) => {
    const bedtime = new Date(log.bedtime);
    let mins = bedtime.getHours() * 60 + bedtime.getMinutes();
    if (mins < 720) mins += 1440; // Normalize past midnight
    return mins;
  });
  const avgBedtime = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  const bedtimeVariance = bedtimeMinutes.reduce((sum, m) => sum + Math.pow(m - avgBedtime, 2), 0) / bedtimeMinutes.length;
  const bedtimeStdDev = Math.sqrt(bedtimeVariance);
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - bedtimeStdDev * 1.5)));

  // Bedtime drift (first half vs second half)
  const halfPoint = Math.floor(nightLogs.length / 2);
  const firstHalfBedtimes = bedtimeMinutes.slice(halfPoint); // Older logs
  const secondHalfBedtimes = bedtimeMinutes.slice(0, halfPoint); // Recent logs
  const firstHalfAvg = firstHalfBedtimes.length > 0
    ? firstHalfBedtimes.reduce((a, b) => a + b, 0) / firstHalfBedtimes.length
    : avgBedtime;
  const secondHalfAvg = secondHalfBedtimes.length > 0
    ? secondHalfBedtimes.reduce((a, b) => a + b, 0) / secondHalfBedtimes.length
    : avgBedtime;
  const bedtimeDriftMinutes = Math.round(secondHalfAvg - firstHalfAvg);

  // Checklist correlations
  const checklistCorrelations = CHECKLIST_ITEMS.map((item) => {
    const matchedData: { checked: boolean; quality: number }[] = [];

    checklistLogs.forEach((cl) => {
      const clDate = normalizeDate(cl.date);
      const sleepLog = nightLogs.find((sl) => normalizeDate(sl.date) === clDate);
      if (sleepLog) {
        matchedData.push({
          checked: cl[item.key as keyof ChecklistLog] as boolean,
          quality: sleepLog.quality,
        });
      }
    });

    if (matchedData.length < 3) return { item: item.key, label: item.label, impact: 0 };

    const withItem = matchedData.filter((d) => d.checked);
    const withoutItem = matchedData.filter((d) => !d.checked);
    const avgWith = withItem.length > 0 ? withItem.reduce((sum, d) => sum + d.quality, 0) / withItem.length : 0;
    const avgWithout = withoutItem.length > 0 ? withoutItem.reduce((sum, d) => sum + d.quality, 0) / withoutItem.length : 0;

    return { item: item.key, label: item.label, impact: avgWith - avgWithout };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Day of week scores
  const dayOfWeekScores: Record<string, { total: number; count: number }> = {};
  scoredLogs.forEach((log) => {
    const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' });
    if (!dayOfWeekScores[day]) dayOfWeekScores[day] = { total: 0, count: 0 };
    dayOfWeekScores[day].total += log.score;
    dayOfWeekScores[day].count += 1;
  });
  const dayScores: Record<string, number> = {};
  Object.entries(dayOfWeekScores).forEach(([day, data]) => {
    dayScores[day] = Math.round(data.total / data.count);
  });

  // Tag frequency and impact
  const tagFrequency: Record<string, { count: number; avgScoreImpact: number }> = {};
  if (tags.length > 0) {
    const tagsByLogId: Record<string, string[]> = {};
    tags.forEach((t) => {
      if (!tagsByLogId[t.sleep_log_id]) tagsByLogId[t.sleep_log_id] = [];
      tagsByLogId[t.sleep_log_id].push(t.tag);
    });

    // Count tags and calculate avg score with vs without
    const tagScores: Record<string, number[]> = {};
    const noTagScores: number[] = [];

    scoredLogs.forEach((log) => {
      const logTags = tagsByLogId[log.id] || [];
      if (logTags.length === 0) {
        noTagScores.push(log.score);
      } else {
        logTags.forEach((tag) => {
          if (!tagScores[tag]) tagScores[tag] = [];
          tagScores[tag].push(log.score);
        });
      }
    });

    const noTagAvg = noTagScores.length > 0
      ? noTagScores.reduce((a, b) => a + b, 0) / noTagScores.length
      : avgRecoveryScore;

    Object.entries(tagScores).forEach(([tag, scores]) => {
      const tagAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
      tagFrequency[tag] = {
        count: scores.length,
        avgScoreImpact: Math.round(tagAvg - noTagAvg),
      };
    });
  }

  // Total period days
  const dates = nightLogs.map((log) => new Date(log.date).getTime());
  const totalPeriodDays = dates.length > 1
    ? Math.round((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)) + 1
    : nightLogs.length;

  // Generate recommendations
  const recommendations = generateRecommendations(
    {
      avgDuration,
      avgQuality,
      avgEnergy,
      avgRecoveryScore,
      sleepDebtHours,
      consistencyScore,
      bedtimeDriftMinutes,
      nightsLogged: nightLogs.length,
      totalPeriodDays,
      checklistCorrelations,
      dayOfWeekScores: dayScores,
      tagFrequency,
      bestDay: { date: best.date, score: best.score },
      worstDay: { date: worst.date, score: worst.score },
      recommendations: [],
    },
    profile
  );

  return {
    avgDuration: Math.round(avgDuration),
    avgQuality: Math.round(avgQuality * 10) / 10,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    avgRecoveryScore,
    sleepDebtHours: Math.round(sleepDebtHours * 10) / 10,
    bestDay: { date: best.date, score: best.score },
    worstDay: { date: worst.date, score: worst.score },
    consistencyScore,
    bedtimeDriftMinutes,
    nightsLogged: nightLogs.length,
    totalPeriodDays,
    checklistCorrelations,
    dayOfWeekScores: dayScores,
    tagFrequency,
    recommendations,
  };
}

export function generateRecommendations(
  stats: MonthlyReportStats,
  profile: Profile
): MonthlyReportStats['recommendations'] {
  const recs: MonthlyReportStats['recommendations'] = [];

  // Consistency
  if (stats.consistencyScore < 60) {
    recs.push({
      category: 'consistency',
      title: 'Stabilize your bedtime',
      detail: `Your bedtime consistency score is ${stats.consistencyScore}/100. Try going to bed within a 30-minute window each night.`,
      priority: 'high',
    });
  }

  // Sleep debt
  if (stats.sleepDebtHours < -3) {
    recs.push({
      category: 'duration',
      title: "You're carrying significant sleep debt",
      detail: `You're ${Math.abs(stats.sleepDebtHours).toFixed(1)}h behind on sleep. Try adding 30 extra minutes each night to recover.`,
      priority: 'high',
    });
  } else if (stats.sleepDebtHours < -1) {
    recs.push({
      category: 'duration',
      title: 'Close the sleep gap',
      detail: `You're ${Math.abs(stats.sleepDebtHours).toFixed(1)}h behind your goal. Small adjustments to bedtime can help.`,
      priority: 'medium',
    });
  }

  // Quality
  if (stats.avgQuality < 3) {
    recs.push({
      category: 'quality',
      title: 'Focus on sleep quality',
      detail: 'Your average quality is below 3/5. Consider your sleep environment: darkness, temperature, and noise levels.',
      priority: 'high',
    });
  }

  // Best checklist correlation
  const positiveCorrelation = stats.checklistCorrelations.find((c) => c.impact > 0.3);
  if (positiveCorrelation) {
    recs.push({
      category: 'habits',
      title: `Keep doing: ${positiveCorrelation.label}`,
      detail: `"${positiveCorrelation.label}" has the biggest positive impact on your sleep quality (+${positiveCorrelation.impact.toFixed(1)}).`,
      priority: 'medium',
    });
  }

  // Worst checklist correlation
  const negativeCorrelation = stats.checklistCorrelations.find((c) => c.impact < -0.3);
  if (negativeCorrelation) {
    recs.push({
      category: 'habits',
      title: `Improve: ${negativeCorrelation.label}`,
      detail: `Skipping "${negativeCorrelation.label}" tends to hurt your sleep quality (${negativeCorrelation.impact.toFixed(1)} impact).`,
      priority: 'medium',
    });
  }

  // Bedtime drift
  if (Math.abs(stats.bedtimeDriftMinutes) > 30) {
    const direction = stats.bedtimeDriftMinutes > 0 ? 'later' : 'earlier';
    recs.push({
      category: 'timing',
      title: `Your bedtime is shifting ${direction}`,
      detail: `Your bedtime shifted ${Math.abs(stats.bedtimeDriftMinutes)} minutes ${direction} compared to earlier in the month.`,
      priority: 'low',
    });
  }

  // User-type specific
  if (profile.user_type === 'athlete' && stats.avgDuration < 480) {
    recs.push({
      category: 'duration',
      title: 'Athletes need more sleep',
      detail: 'Research shows athletes perform best with 8-10 hours of sleep. Your average is below 8 hours.',
      priority: 'medium',
    });
  }

  // Goal-specific
  if (profile.goal === 'consistency' && stats.consistencyScore >= 80) {
    recs.push({
      category: 'consistency',
      title: 'Great consistency!',
      detail: `Your consistency score of ${stats.consistencyScore}/100 shows you're maintaining a solid routine. Keep it up!`,
      priority: 'low',
    });
  }

  return recs.slice(0, 5); // Max 5 recommendations
}

export function computeComparison(
  currentStats: MonthlyReportStats,
  previousReport: MonthlyReport | null
): MonthlyReportComparison | null {
  if (!previousReport) return null;

  const prevStats = previousReport.stats;
  return {
    prevAvgScore: prevStats.avgRecoveryScore,
    scoreDelta: currentStats.avgRecoveryScore - prevStats.avgRecoveryScore,
    prevAvgDuration: prevStats.avgDuration,
    durationDelta: currentStats.avgDuration - prevStats.avgDuration,
    prevConsistency: prevStats.consistencyScore,
    consistencyDelta: currentStats.consistencyScore - prevStats.consistencyScore,
  };
}

export async function getUsersForMonthlyReport(): Promise<
  { id: string; profile: Profile }[]
> {
  const supabase = getSupabaseAdmin();

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error || !profiles) {
    console.error('[MonthlyReport] Failed to get profiles:', error);
    return [];
  }

  const usersForReport: { id: string; profile: Profile }[] = [];

  for (const profile of profiles) {
    // Check if user has 30+ sleep logs
    const { count } = await supabase
      .from('sleep_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_nap', false);

    if (!count || count < 30) continue;

    // Calculate period start (30 days ago from today)
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    // Check if report already exists for this period
    const { data: existingReport } = await supabase
      .from('monthly_reports')
      .select('id')
      .eq('user_id', profile.id)
      .eq('period_start', periodStartStr)
      .single();

    if (existingReport) continue;

    usersForReport.push({ id: profile.id, profile: profile as Profile });
  }

  return usersForReport;
}

export async function createMonthlyReport(
  userId: string,
  periodStart: string,
  periodEnd: string,
  sleepLogs: SleepLog[],
  checklistLogs: ChecklistLog[],
  profile: Profile,
  previousReport: MonthlyReport | null,
  tags: SleepLogTag[] = []
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const stats = computeMonthlyStats(sleepLogs, checklistLogs, profile, tags);
  const comparison = computeComparison(stats, previousReport);

  const { data, error } = await supabase
    .from('monthly_reports')
    .insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      stats,
      comparison,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[MonthlyReport] Failed to create report:', error);
    throw error;
  }

  return data.id;
}
