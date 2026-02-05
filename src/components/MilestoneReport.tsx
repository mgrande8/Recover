'use client';

import { useEffect, useState, useRef } from 'react';
import {
  X,
  Trophy,
  Moon,
  TrendingUp,
  Clock,
  Flame,
  Calendar,
  Star,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import * as htmlToImage from 'html-to-image';
import type { SleepLog, Profile } from '@/types';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';

const STORAGE_KEY = 'recover_milestone_reports';
const MILESTONES = [30, 60, 90, 180, 365];

interface MilestoneReportProps {
  sleepLogs: SleepLog[];
  profile: Profile;
  totalDaysTracked: number;
}

interface MilestoneStats {
  period: number;
  avgScore: number;
  avgDuration: number;
  totalHours: number;
  bestScore: number;
  worstScore: number;
  avgQuality: number;
  avgEnergy: number;
  nightsLogged: number;
  currentStreak: number;
  longestStreak: number;
  improvementPercent: number | null;
}

export function MilestoneReport({ sleepLogs, profile, totalDaysTracked }: MilestoneReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find the highest milestone the user has reached but not yet seen
    const milestone = MILESTONES.find((m) => {
      if (totalDaysTracked < m) return false;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const seen = stored ? JSON.parse(stored) : {};
        return !seen[m];
      } catch {
        return true;
      }
    });

    if (!milestone) return;

    // Calculate stats for this milestone period
    const nightLogs = sleepLogs.filter((log) => !log.is_nap);
    const periodLogs = nightLogs.slice(0, milestone);

    if (periodLogs.length < 7) return; // Need at least a week of data

    const scores = periodLogs.map((log) => calculateRecoveryScore(log, profile).score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const avgDuration = Math.round(
      periodLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / periodLogs.length
    );
    const totalHours = Math.round(
      periodLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / 60
    );
    const avgQuality =
      Math.round(
        (periodLogs.reduce((sum, log) => sum + log.quality, 0) / periodLogs.length) * 10
      ) / 10;
    const avgEnergy =
      Math.round(
        (periodLogs.reduce((sum, log) => sum + log.energy, 0) / periodLogs.length) * 10
      ) / 10;

    // Calculate improvement (compare first half to second half)
    let improvementPercent: number | null = null;
    if (periodLogs.length >= 14) {
      const halfPoint = Math.floor(periodLogs.length / 2);
      const recentHalf = periodLogs.slice(0, halfPoint);
      const olderHalf = periodLogs.slice(halfPoint);

      const recentAvg =
        recentHalf.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) /
        recentHalf.length;
      const olderAvg =
        olderHalf.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) /
        olderHalf.length;

      improvementPercent = Math.round(recentAvg - olderAvg);
    }

    setStats({
      period: milestone,
      avgScore,
      avgDuration,
      totalHours,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      avgQuality,
      avgEnergy,
      nightsLogged: periodLogs.length,
      currentStreak: totalDaysTracked,
      longestStreak: totalDaysTracked, // Simplified - could track separately
      improvementPercent,
    });

    setCurrentMilestone(milestone);

    // Small delay so dashboard loads first
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [sleepLogs, profile, totalDaysTracked]);

  const handleClose = () => {
    if (currentMilestone) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const seen = stored ? JSON.parse(stored) : {};
        seen[currentMilestone] = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
      } catch {}
    }
    setIsOpen(false);
  };

  const handleShare = async () => {
    if (!cardRef.current || !stats) return;

    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0a0f',
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `recover-${stats.period}-day-report.png`, {
        type: 'image/png',
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: `My ${stats.period}-day sleep report from Recover! Average recovery score: ${stats.avgScore}. Track your sleep at https://apps.apple.com/app/id6758255662`,
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen || !stats || !currentMilestone) return null;

  const getMilestoneTitle = (days: number) => {
    if (days === 30) return 'Your First Month';
    if (days === 60) return '2 Month Report';
    if (days === 90) return 'Quarterly Review';
    if (days === 180) return '6 Month Report';
    if (days === 365) return 'Your Year in Sleep';
    return `${days} Day Report`;
  };

  const getMilestoneEmoji = (days: number) => {
    if (days === 30) return '🎉';
    if (days === 60) return '⭐';
    if (days === 90) return '🏆';
    if (days === 180) return '👑';
    if (days === 365) return '🎊';
    return '🌙';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shareable Card */}
        <div ref={cardRef} className="bg-gradient-to-br from-[#0a0a0f] via-[#0f0f2a] to-[#0a0a0f]">
          {/* Header */}
          <div className="px-6 py-8 text-center border-b border-border/50">
            <div className="text-5xl mb-3">{getMilestoneEmoji(currentMilestone)}</div>
            <h2 className="text-2xl font-bold text-text-primary">{getMilestoneTitle(currentMilestone)}</h2>
            <p className="text-text-secondary mt-1">{currentMilestone} days of tracking with Recover</p>
          </div>

          {/* Main Score */}
          <div className="px-6 py-6 text-center">
            <p className="text-sm text-text-muted uppercase tracking-wide mb-2">Average Recovery Score</p>
            <p className={`text-7xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}</p>
            {stats.improvementPercent !== null && stats.improvementPercent !== 0 && (
              <p
                className={`text-sm font-medium mt-2 ${
                  stats.improvementPercent > 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {stats.improvementPercent > 0 ? '↑' : '↓'} {Math.abs(stats.improvementPercent)} points
                from your first days
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-text-primary">{formatDuration(stats.avgDuration)}</p>
                <p className="text-xs text-text-muted">Avg Sleep</p>
              </div>
              <div className="bg-background/50 rounded-xl p-4 text-center">
                <Moon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-text-primary">{stats.totalHours}h</p>
                <p className="text-xs text-text-muted">Total Sleep</p>
              </div>
              <div className="bg-background/50 rounded-xl p-4 text-center">
                <Star className="w-5 h-5 text-warning mx-auto mb-2" />
                <p className="text-xl font-bold text-text-primary">{stats.avgQuality}/5</p>
                <p className="text-xs text-text-muted">Avg Quality</p>
              </div>
              <div className="bg-background/50 rounded-xl p-4 text-center">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-text-primary">{stats.nightsLogged}</p>
                <p className="text-xs text-text-muted">Nights Logged</p>
              </div>
            </div>

            {/* Best/Worst */}
            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-success/10 border border-success/20 rounded-xl p-3 text-center">
                <p className="text-xs text-success mb-1">Best Night</p>
                <p className="text-2xl font-bold text-success">{stats.bestScore}</p>
              </div>
              <div className="flex-1 bg-danger/10 border border-danger/20 rounded-xl p-3 text-center">
                <p className="text-xs text-danger mb-1">Worst Night</p>
                <p className="text-2xl font-bold text-danger">{stats.worstScore}</p>
              </div>
            </div>

            {/* Branding */}
            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-2">
              <Moon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-text-primary">Recover</span>
              <span className="text-xs text-text-muted">• Sleep Better. Perform Better.</span>
            </div>
          </div>
        </div>

        {/* Actions (outside shareable area) */}
        <div className="px-6 py-4 border-t border-border bg-card">
          <Button onClick={handleShare} className="w-full mb-2" disabled={isSharing}>
            <Share2 className="w-4 h-4 mr-2" />
            {isSharing ? 'Generating...' : 'Share Your Report'}
          </Button>
          <Button onClick={handleClose} variant="ghost" className="w-full">
            Continue to Dashboard
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
