'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'recharts';
import {
  Crown,
  ChevronRight,
  TrendingUp,
  Clock,
  Target,
  Battery,
} from 'lucide-react';
import type { SleepLog, Profile } from '@/types';
import { calculateRecoveryScore } from '@/lib/utils';

interface DashboardProChartsProps {
  sleepLogs: SleepLog[];
  profile: Profile;
}

const colors = {
  primary: '#6366F1',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#64748B',
  border: '#1F2937',
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-xs">
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-medium" style={{ color: entry.color }}>
            {entry.value}{entry.name === 'Duration' ? 'h' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Mini Recovery Score Chart
function MiniRecoveryChart({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  const data = sleepLogs
    .slice(0, 7)
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
      score: calculateRecoveryScore(log, profile).score,
    }));

  const getBarColor = (score: number) => {
    if (score >= 70) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <XAxis
            dataKey="date"
            stroke={colors.muted}
            fontSize={9}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[3, 3, 0, 0]} name="Score">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini Duration Chart
function MiniDurationChart({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  const data = sleepLogs
    .slice(0, 7)
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
      duration: parseFloat((log.duration_minutes / 60).toFixed(1)),
      goal: profile.sleep_goal_hours,
    }));

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke={colors.muted}
            fontSize={9}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="goal"
            stroke={colors.success}
            strokeDasharray="3 3"
            strokeWidth={1}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="duration"
            stroke={colors.primary}
            fill="url(#durationGrad)"
            strokeWidth={2}
            name="Duration"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sleep Debt Mini Card
function SleepDebtMini({ sleepLogs, profile }: { sleepLogs: SleepLog[]; profile: Profile }) {
  const goalMinutes = profile.sleep_goal_hours * 60;
  const recentLogs = sleepLogs.slice(0, 7);
  let totalDebt = 0;

  recentLogs.forEach((log) => {
    totalDebt += log.duration_minutes - goalMinutes;
  });

  const debtHours = Math.abs(totalDebt) / 60;
  const isDebt = totalDebt < 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Battery className={`w-4 h-4 ${isDebt ? 'text-danger' : 'text-success'}`} />
        <span className="text-sm text-text-secondary">Sleep Bank</span>
      </div>
      <span className={`text-sm font-bold ${isDebt ? 'text-danger' : 'text-success'}`}>
        {isDebt ? '-' : '+'}{debtHours.toFixed(1)}h
      </span>
    </div>
  );
}

export function DashboardProCharts({ sleepLogs, profile }: DashboardProChartsProps) {
  if (sleepLogs.length < 3) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-pro-accent" />
          <span className="font-medium text-text-primary">Pro Analytics</span>
        </div>
        <Link
          href="/dashboard/insights"
          className="text-xs text-pro-accent hover:text-pro-accent/80 flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="p-4 space-y-4">
        {/* Recovery Score Chart */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-success" />
            <span className="text-xs text-text-muted">Recovery Trend (7 days)</span>
          </div>
          <MiniRecoveryChart sleepLogs={sleepLogs} profile={profile} />
        </div>

        {/* Duration Chart */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-text-muted">Sleep Duration vs Goal</span>
          </div>
          <MiniDurationChart sleepLogs={sleepLogs} profile={profile} />
        </div>

        {/* Sleep Debt */}
        <div className="pt-2 border-t border-border">
          <SleepDebtMini sleepLogs={sleepLogs} profile={profile} />
        </div>
      </div>
    </div>
  );
}
