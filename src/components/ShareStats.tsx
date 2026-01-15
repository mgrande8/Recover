'use client';

import { useState, useRef } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Download,
  Twitter,
  MessageCircle,
  Flame,
  Moon,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui';
import type { SleepLog, Profile } from '@/types';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';

interface ShareStatsProps {
  sleepLogs: SleepLog[];
  profile: Profile;
  currentStreak: number;
}

export function ShareStats({ sleepLogs, profile, currentStreak }: ShareStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (sleepLogs.length === 0) return null;

  // Calculate stats
  const latestLog = sleepLogs[0];
  const latestScore = calculateRecoveryScore(latestLog, profile).score;

  const recentLogs = sleepLogs.slice(0, 7);
  const avgScore = Math.round(
    recentLogs.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) / recentLogs.length
  );
  const avgDuration = Math.round(
    recentLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / recentLogs.length
  );

  // Calculate trend
  const olderLogs = sleepLogs.slice(7, 14);
  let trend = 0;
  if (olderLogs.length > 0) {
    const olderAvg = olderLogs.reduce((sum, log) => sum + calculateRecoveryScore(log, profile).score, 0) / olderLogs.length;
    trend = Math.round(avgScore - olderAvg);
  }

  // Generate share text
  const shareText = `My sleep stats from Recover:
Recovery Score: ${latestScore}
7-Day Average: ${avgScore}
${currentStreak > 0 ? `Streak: ${currentStreak} days` : ''}
${trend !== 0 ? `Trend: ${trend > 0 ? '+' : ''}${trend} points` : ''}

Track your sleep with Recover`;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Handle native share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Sleep Stats - Recover',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Handle Twitter share
  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(`My sleep stats from @RecoverApp:

Recovery Score: ${latestScore}
7-Day Average: ${avgScore}
${currentStreak > 0 ? `Streak: ${currentStreak} days` : ''}

Track your sleep at ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  // Handle Messages share (iOS)
  const handleMessagesShare = () => {
    const smsText = encodeURIComponent(shareText);
    window.location.href = `sms:?&body=${smsText}`;
  };

  // Check if Web Share API is available
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-card-hover transition-all"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Share</span>
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-text-primary">Share Your Stats</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-4">
              <div
                ref={cardRef}
                className="bg-gradient-to-br from-background to-card rounded-xl border border-border p-4"
              >
                {/* App branding */}
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="w-5 h-5 text-primary" />
                  <span className="font-bold text-text-primary">Recover</span>
                </div>

                {/* Main score */}
                <div className="text-center mb-4">
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Recovery Score</p>
                  <p className="text-5xl font-bold text-success">{latestScore}</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-text-primary">{avgScore}</p>
                    <p className="text-[10px] text-text-muted">7-Day Avg</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-3.5 h-3.5 text-warning" />
                    </div>
                    <p className="text-lg font-bold text-text-primary">{formatDuration(avgDuration)}</p>
                    <p className="text-[10px] text-text-muted">Avg Sleep</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <p className="text-lg font-bold text-text-primary">{currentStreak}</p>
                    <p className="text-[10px] text-text-muted">Day Streak</p>
                  </div>
                </div>

                {/* Trend */}
                {trend !== 0 && (
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <p className={`text-sm font-medium ${trend > 0 ? 'text-success' : 'text-danger'}`}>
                      {trend > 0 ? '+' : ''}{trend} points vs last week
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Share options */}
            <div className="px-4 pb-4 space-y-3">
              {/* Native share button (if available) */}
              {canNativeShare && (
                <Button onClick={handleNativeShare} className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}

              {/* Other share options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="text-xs text-text-secondary">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleTwitterShare}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors"
                >
                  <Twitter className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-secondary">Twitter</span>
                </button>
                <button
                  onClick={handleMessagesShare}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-secondary">Message</span>
                </button>
              </div>

              {/* Text preview */}
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted whitespace-pre-line">{shareText}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
