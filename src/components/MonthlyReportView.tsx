'use client';

import { useRef, useState } from 'react';
import { Share2, Moon } from 'lucide-react';
import { Button } from '@/components/ui';
import * as htmlToImage from 'html-to-image';
import { formatDuration } from '@/lib/utils';
import type { MonthlyReport } from '@/types';

interface MonthlyReportViewProps {
  report: MonthlyReport;
}

export function MonthlyReportView({ report }: MonthlyReportViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const stats = report.stats;
  const periodStart = new Date(report.period_start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const periodEnd = new Date(report.period_end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0a0f',
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `recover-30-day-report.png`, {
        type: 'image/png',
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: `My 30-day sleep report from Recover! Average recovery score: ${stats.avgRecoveryScore}. Track your sleep at https://apps.apple.com/app/id6758255662`,
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

  const topRec = stats.recommendations[0];

  return (
    <>
      {/* Hidden shareable card */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={cardRef} className="w-[400px] bg-gradient-to-br from-[#0a0a0f] via-[#0f0f2a] to-[#0a0a0f] p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-text-muted uppercase tracking-wide mb-1">30-Day Sleep Report</p>
            <p className="text-xs text-text-muted">{periodStart} — {periodEnd}</p>
          </div>

          <div className="text-center mb-6">
            <p className="text-6xl font-bold text-primary">{stats.avgRecoveryScore}</p>
            <p className="text-sm text-text-muted mt-1">Avg Recovery Score</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-background/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{formatDuration(stats.avgDuration)}</p>
              <p className="text-xs text-text-muted">Avg Sleep</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{stats.consistencyScore}/100</p>
              <p className="text-xs text-text-muted">Consistency</p>
            </div>
          </div>

          {topRec && (
            <div className="bg-primary/10 rounded-xl p-3 mb-6">
              <p className="text-xs text-primary font-medium">{topRec.title}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border/50 flex items-center justify-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">Recover</span>
            <span className="text-xs text-text-muted">Sleep Better. Perform Better.</span>
          </div>
        </div>
      </div>

      {/* Share button */}
      <Button onClick={handleShare} className="w-full" variant="outline" disabled={isSharing}>
        <Share2 className="w-4 h-4 mr-2" />
        {isSharing ? 'Generating...' : 'Share Report'}
      </Button>
    </>
  );
}
