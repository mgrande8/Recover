'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Moon,
  Sun,
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Battery,
  Coffee,
  Wine,
  Dumbbell,
} from 'lucide-react';
import type { SleepLog, ChecklistLog, Profile } from '@/types';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';

interface ProInsightsProps {
  sleepLogs: SleepLog[];
  checklistLogs: ChecklistLog[];
  profile: Profile;
  dateRange: '7' | '14' | '30';
  onDateRangeChange: (range: '7' | '14' | '30') => void;
}

// Color scheme matching the app
const colors = {
  primary: '#6366F1',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#64748B',
  background: '#0A0E1A',
  card: '#111827',
  border: '#1F2937',
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Map entry names to their units
    const getUnit = (name: string) => {
      switch (name) {
        case 'Duration':
        case 'Goal':
          return 'h';
        case 'Quality':
        case 'Energy':
          return '/5';
        case 'Score':
        case 'Bedtime':
        case 'Wake Time':
          return '';
        default:
          return '';
      }
    };

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-text-secondary text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-text-primary font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value}{getUnit(entry.name)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Sleep Duration Trends Chart
export function SleepDurationChart({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 2) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Sleep Duration Trends</h3>
        </div>
        <p className="text-text-muted text-sm text-center py-8">Need at least 2 sleep logs to show trends</p>
      </div>
    );
  }

  const data = sleepLogs
    .slice(0, 14)
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      duration: parseFloat((log.duration_minutes / 60).toFixed(1)),
      goal: profile.sleep_goal_hours || 8,
    }));

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">Sleep Duration Trends</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="date"
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 12]}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="goal"
              stroke={colors.success}
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Goal"
            />
            <Area
              type="monotone"
              dataKey="duration"
              stroke={colors.primary}
              fill="url(#durationGradient)"
              strokeWidth={2}
              name="Duration"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-primary rounded" />
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-success rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22C55E 0, #22C55E 4px, transparent 4px, transparent 8px)' }} />
          <span>Goal ({profile.sleep_goal_hours}h)</span>
        </div>
      </div>
    </div>
  );
}

// Sleep Quality Bar Chart
export function SleepQualityChart({ sleepLogs }: { sleepLogs: SleepLog[] }) {
  if (sleepLogs.length < 2) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-text-primary">Quality & Energy</h3>
        </div>
        <p className="text-text-muted text-sm text-center py-8">Need at least 2 sleep logs to show trends</p>
      </div>
    );
  }

  const data = sleepLogs
    .slice(0, 14)
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      quality: log.quality,
      energy: log.energy,
    }));

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-text-primary">Quality & Energy</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="date"
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 5]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quality" fill={colors.warning} radius={[4, 4, 0, 0]} name="Quality" />
            <Bar dataKey="energy" fill={colors.success} radius={[4, 4, 0, 0]} name="Energy" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-warning rounded" />
          <span>Quality</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-success rounded" />
          <span>Energy</span>
        </div>
      </div>
    </div>
  );
}

// Recovery Score Trend
export function RecoveryScoreChart({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 2) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-success" />
          <h3 className="font-semibold text-text-primary">Recovery Score Trend</h3>
        </div>
        <p className="text-text-muted text-sm text-center py-8">Need at least 2 sleep logs to show trends</p>
      </div>
    );
  }

  const data = sleepLogs
    .slice(0, 14)
    .reverse()
    .map((log) => {
      const recovery = calculateRecoveryScore(log, profile);
      return {
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: recovery.score,
        level: recovery.level,
      };
    });

  const getBarColor = (score: number) => {
    if (score >= 70) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-success" />
        <h3 className="font-semibold text-text-primary">Recovery Score Trend</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="date"
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Score">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-success rounded" />
          <span>70+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-warning rounded" />
          <span>50-69</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-danger rounded" />
          <span>&lt;50</span>
        </div>
      </div>
    </div>
  );
}

// Bedtime/Wake Time Pattern Chart
export function SleepTimingChart({ sleepLogs }: { sleepLogs: SleepLog[] }) {
  if (sleepLogs.length < 2) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Sleep Timing Patterns</h3>
        </div>
        <p className="text-text-muted text-sm text-center py-8">Need at least 2 sleep logs to show patterns</p>
      </div>
    );
  }

  const data = sleepLogs
    .slice(0, 14)
    .reverse()
    .map((log) => {
      const bedtime = new Date(log.bedtime);
      const wakeTime = new Date(log.wake_time);

      // Convert to hours (24-hour format, handling midnight crossing)
      let bedHour = bedtime.getHours() + bedtime.getMinutes() / 60;
      const wakeHour = wakeTime.getHours() + wakeTime.getMinutes() / 60;

      // Normalize bedtime for display (if after midnight, add to previous day context)
      if (bedHour < 12) bedHour += 24;

      return {
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bedtime: parseFloat(bedHour.toFixed(1)),
        wakeTime: parseFloat(wakeHour.toFixed(1)),
      };
    });

  const formatTime = (hour: number) => {
    const h = hour > 24 ? hour - 24 : hour;
    const meridian = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${Math.floor(displayHour)}${meridian}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Moon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">Sleep Timing Patterns</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="date"
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={colors.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[4, 28]}
              tickFormatter={formatTime}
            />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value !== 'number') return [String(value), String(name)];
                const h = value > 24 ? value - 24 : value;
                const mins = Math.round((h % 1) * 60);
                const hrs = Math.floor(h > 12 ? h - 12 : h);
                const meridian = h >= 12 && h < 24 ? 'PM' : 'AM';
                return [`${hrs}:${mins.toString().padStart(2, '0')} ${meridian}`, String(name)];
              }}
            />
            <Line
              type="monotone"
              dataKey="bedtime"
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ fill: colors.primary, strokeWidth: 0, r: 4 }}
              name="Bedtime"
            />
            <Line
              type="monotone"
              dataKey="wakeTime"
              stroke={colors.warning}
              strokeWidth={2}
              dot={{ fill: colors.warning, strokeWidth: 0, r: 4 }}
              name="Wake Time"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Moon className="w-3 h-3 text-primary" />
          <span>Bedtime</span>
        </div>
        <div className="flex items-center gap-1">
          <Sun className="w-3 h-3 text-warning" />
          <span>Wake Time</span>
        </div>
      </div>
    </div>
  );
}

// Sleep Consistency Score
export function SleepConsistencyCard({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 7) return null;

  // Calculate bedtime consistency (standard deviation of bedtimes in hours)
  const bedtimes = sleepLogs.slice(0, 7).map((log) => {
    const bedtime = new Date(log.bedtime);
    let hour = bedtime.getHours() + bedtime.getMinutes() / 60;
    if (hour < 12) hour += 24;
    return hour;
  });

  const avgBedtime = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length;
  const variance = bedtimes.reduce((sum, bt) => sum + Math.pow(bt - avgBedtime, 2), 0) / bedtimes.length;
  const stdDev = Math.sqrt(variance); // Standard deviation in hours

  // Calculate duration consistency (standard deviation in hours)
  const durations = sleepLogs.slice(0, 7).map((log) => log.duration_minutes / 60);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const durationVariance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
  const durationStdDev = Math.sqrt(durationVariance);

  // Calculate consistency score using combined standard deviation
  // Formula: consistency_score = 100 - (stdDev_hours * 20), capped 0-100
  const combinedStdDev = (stdDev + durationStdDev) / 2;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - combinedStdDev * 20)));

  // Color coding: >85% green, >70% yellow, <70% red
  const getConsistencyLevel = (score: number) => {
    if (score > 85) return { label: 'Excellent', color: 'text-success', bg: 'bg-success' };
    if (score > 70) return { label: 'Good', color: 'text-warning', bg: 'bg-warning' };
    return { label: 'Needs Work', color: 'text-danger', bg: 'bg-danger' };
  };

  const level = getConsistencyLevel(consistencyScore);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">Sleep Consistency</h3>
      </div>
      <div className="text-center mb-4">
        <div className={`text-5xl font-bold ${level.color} mb-1`}>{consistencyScore}</div>
        <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${level.bg} transition-all duration-500`}
          style={{ width: `${consistencyScore}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 text-center text-sm">
        <div>
          <p className="text-text-muted mb-1">Bedtime Variation</p>
          <p className={`font-medium ${stdDev < 0.5 ? 'text-success' : stdDev < 1 ? 'text-warning' : 'text-danger'}`}>
            ±{(stdDev * 60).toFixed(0)} min
          </p>
        </div>
        <div>
          <p className="text-text-muted mb-1">Duration Variation</p>
          <p className={`font-medium ${durationStdDev < 0.5 ? 'text-success' : durationStdDev < 1 ? 'text-warning' : 'text-danger'}`}>
            ±{(durationStdDev * 60).toFixed(0)} min
          </p>
        </div>
      </div>
    </div>
  );
}

// Weekly Comparison Chart
export function WeeklyComparisonChart({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  if (sleepLogs.length < 7) return null;

  const thisWeek = sleepLogs.slice(0, 7);
  const lastWeek = sleepLogs.slice(7, 14);

  const calculateWeekStats = (logs: SleepLog[]) => {
    if (logs.length === 0) return null;
    const avgDuration = logs.reduce((sum, log) => sum + log.duration_minutes, 0) / logs.length / 60;
    const avgQuality = logs.reduce((sum, log) => sum + log.quality, 0) / logs.length;
    const avgScore = logs.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) / logs.length;
    return { avgDuration, avgQuality, avgScore };
  };

  const thisWeekStats = calculateWeekStats(thisWeek);
  const lastWeekStats = calculateWeekStats(lastWeek);

  if (!thisWeekStats) return null;

  const data = [
    {
      name: 'Duration',
      thisWeek: parseFloat(thisWeekStats.avgDuration.toFixed(1)),
      lastWeek: lastWeekStats ? parseFloat(lastWeekStats.avgDuration.toFixed(1)) : 0,
      unit: 'h',
    },
    {
      name: 'Quality',
      thisWeek: parseFloat(thisWeekStats.avgQuality.toFixed(1)),
      lastWeek: lastWeekStats ? parseFloat(lastWeekStats.avgQuality.toFixed(1)) : 0,
      unit: '/5',
    },
    {
      name: 'Score',
      thisWeek: Math.round(thisWeekStats.avgScore),
      lastWeek: lastWeekStats ? Math.round(lastWeekStats.avgScore) : 0,
      unit: '',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-success" />
        <h3 className="font-semibold text-text-primary">Weekly Comparison</h3>
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const change = lastWeekStats ? item.thisWeek - item.lastWeek : 0;
          const isImproved = change > 0;

          return (
            <div key={item.name} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{item.name}</p>
                <p className="text-xl font-bold text-text-primary">
                  {item.thisWeek}
                  {item.unit}
                </p>
              </div>
              {lastWeekStats && (
                <div className={`flex items-center gap-1 ${isImproved ? 'text-success' : change < 0 ? 'text-danger' : 'text-text-muted'}`}>
                  {isImproved ? <TrendingUp className="w-4 h-4" /> : change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                  <span className="text-sm font-medium">
                    {change > 0 ? '+' : ''}
                    {item.name === 'Score' ? Math.round(change) : change.toFixed(1)}
                    {item.unit}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {lastWeekStats && (
        <p className="text-xs text-text-muted text-center mt-4">Compared to last week</p>
      )}
    </div>
  );
}

// Actionable Insights Card
export function InsightsRecommendations({ sleepLogs, checklistLogs, profile }: { sleepLogs: SleepLog[]; checklistLogs: ChecklistLog[]; profile: Profile }) {
  const insights: { icon: React.ElementType; iconColor: string; title: string; description: string; type: 'success' | 'warning' | 'danger' }[] = [];

  if (sleepLogs.length < 3) return null;

  // Analyze sleep duration
  const logsForAvg = sleepLogs.slice(0, 7);
  const avgDuration = logsForAvg.length > 0
    ? logsForAvg.reduce((sum, log) => sum + log.duration_minutes, 0) / logsForAvg.length / 60
    : 0;
  const sleepGoal = profile.sleep_goal_hours || 8;
  const goalDiff = avgDuration - sleepGoal;

  if (goalDiff < -0.5) {
    insights.push({
      icon: Battery,
      iconColor: 'text-danger',
      title: 'Sleep Debt Alert',
      description: `You're averaging ${Math.abs(goalDiff * 60).toFixed(0)} minutes less than your goal. Try going to bed 30 minutes earlier.`,
      type: 'danger',
    });
  } else if (goalDiff >= 0) {
    insights.push({
      icon: CheckCircle,
      iconColor: 'text-success',
      title: 'Meeting Your Goal',
      description: `You're averaging ${avgDuration.toFixed(1)} hours, meeting your ${sleepGoal}h goal. Keep it up!`,
      type: 'success',
    });
  }

  // Analyze checklist compliance
  if (checklistLogs.length >= 3) {
    const checklistItems = ['exercised', 'no_caffeine_after_2pm', 'no_alcohol', 'no_heavy_meal', 'room_dark', 'room_cool', 'screens_off_30min', 'phone_not_in_bed'];
    const recentLogs = checklistLogs.slice(0, 7);

    const itemAverages = checklistItems.map((item) => ({
      item,
      avg: recentLogs.length > 0
        ? recentLogs.filter((log) => log[item as keyof ChecklistLog] === true).length / recentLogs.length
        : 0,
    }));

    const lowestItem = itemAverages.sort((a, b) => a.avg - b.avg)[0];

    if (lowestItem.avg < 0.5) {
      const itemLabels: Record<string, { label: string; icon: React.ElementType }> = {
        exercised: { label: 'exercising', icon: Dumbbell },
        no_caffeine_after_2pm: { label: 'limiting caffeine', icon: Coffee },
        no_alcohol: { label: 'avoiding alcohol', icon: Wine },
        no_heavy_meal: { label: 'avoiding heavy meals', icon: AlertCircle },
        room_dark: { label: 'keeping your room dark', icon: Moon },
        room_cool: { label: 'keeping your room cool', icon: AlertCircle },
        screens_off_30min: { label: 'turning off screens early', icon: AlertCircle },
        phone_not_in_bed: { label: 'keeping your phone away', icon: AlertCircle },
      };

      const itemInfo = itemLabels[lowestItem.item] || { label: lowestItem.item, icon: AlertCircle };
      insights.push({
        icon: itemInfo.icon,
        iconColor: 'text-warning',
        title: 'Habit to Improve',
        description: `Focus on ${itemInfo.label}. You've only done this ${Math.round(lowestItem.avg * 100)}% of the time recently.`,
        type: 'warning',
      });
    }
  }

  // Analyze bedtime consistency
  const bedtimes = sleepLogs.slice(0, 7).map((log) => {
    const bt = new Date(log.bedtime);
    let hour = bt.getHours() + bt.getMinutes() / 60;
    if (hour < 12) hour += 24;
    return hour;
  });
  const avgBedtime = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length;
  const bedtimeVariance = Math.sqrt(bedtimes.reduce((sum, bt) => sum + Math.pow(bt - avgBedtime, 2), 0) / bedtimes.length);

  if (bedtimeVariance > 1) {
    insights.push({
      icon: Clock,
      iconColor: 'text-warning',
      title: 'Inconsistent Bedtime',
      description: `Your bedtime varies by ±${(bedtimeVariance * 60).toFixed(0)} minutes. Try to be more consistent for better sleep quality.`,
      type: 'warning',
    });
  }

  // Analyze recent trend
  const recentScores = sleepLogs.slice(0, 3).map((log) => calculateRecoveryScore(log, profile).score);
  const olderScores = sleepLogs.slice(3, 7).map((log) => calculateRecoveryScore(log, profile).score);

  if (recentScores.length >= 3 && olderScores.length >= 3) {
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

    if (recentAvg > olderAvg + 5) {
      insights.push({
        icon: TrendingUp,
        iconColor: 'text-success',
        title: 'Improving Trend',
        description: `Your recovery scores have improved by ${Math.round(recentAvg - olderAvg)} points. Great progress!`,
        type: 'success',
      });
    } else if (recentAvg < olderAvg - 5) {
      insights.push({
        icon: TrendingDown,
        iconColor: 'text-danger',
        title: 'Declining Trend',
        description: `Your recovery scores have dropped by ${Math.round(olderAvg - recentAvg)} points. Review your sleep habits.`,
        type: 'danger',
      });
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-text-primary">Personalized Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                insight.type === 'success'
                  ? 'bg-success/5 border-success/20'
                  : insight.type === 'warning'
                  ? 'bg-warning/5 border-warning/20'
                  : 'bg-danger/5 border-danger/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${insight.iconColor} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="font-medium text-text-primary text-sm">{insight.title}</p>
                  <p className="text-text-secondary text-sm">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
