'use client';

import { useState, useRef } from 'react';
import {
  Share2,
  X,
  Download,
  MessageCircle,
  Flame,
  Moon,
  TrendingUp,
  Clock,
  Instagram,
  Twitter,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import type { SleepLog, Profile } from '@/types';
import { calculateRecoveryScore, formatDuration } from '@/lib/utils';

const APP_STORE_URL = 'https://apps.apple.com/app/id6758255662';

interface ShareStatsProps {
  sleepLogs: SleepLog[];
  profile: Profile;
  currentStreak: number;
}

export function ShareStats({ sleepLogs, profile, currentStreak }: ShareStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ dataUrl: string; blob: Blob; mode: 'save' | 'instagram' } | null>(null);
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

  // Score color for story image
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  // Share text
  const shareText = `My sleep stats from Recover:\n\nRecovery Score: ${latestScore}\n7-Day Average: ${avgScore}${currentStreak > 0 ? `\nStreak: ${currentStreak} days` : ''}\n\nTrack your sleep with Recover\n${APP_STORE_URL}`;

  // Generate image from the preview card
  const generateCardImage = async (): Promise<{ dataUrl: string; blob: Blob } | null> => {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0a0f',
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return { dataUrl, blob };
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  // Generate full-screen Instagram Story image (1080x1920)
  const generateStoryImage = async (): Promise<{ dataUrl: string; blob: Blob } | null> => {
    // Create a container that clips overflow so the large story element isn't visible
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 1px;
      height: 1px;
      overflow: hidden;
      pointer-events: none;
    `;

    const story = document.createElement('div');
    story.style.cssText = `
      width: 1080px;
      height: 1920px;
      background: linear-gradient(180deg, #08081a 0%, #0f0f2e 35%, #111130 50%, #0d0d24 75%, #08081a 100%);
      padding: 140px 80px 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      color: white;
      box-sizing: border-box;
      position: relative;
    `;

    const trendHtml = trend !== 0 ? `
      <div style="font-size: 32px; font-weight: 600; color: ${trend > 0 ? '#22c55e' : '#ef4444'}; margin-top: 48px; text-align: center;">
        ${trend > 0 ? '+' : ''}${trend} points vs last week
      </div>
    ` : '';

    story.innerHTML = `
      <div style="text-align: center; width: 100%; margin-bottom: 100px;">
        <div style="margin-bottom: 16px;">
          <span style="font-size: 56px; font-weight: 800; letter-spacing: 8px; color: #6366f1;">&#9790;</span>
          <span style="font-size: 56px; font-weight: 800; letter-spacing: 8px; color: white; margin-left: 12px;">RECOVER</span>
        </div>
        <div style="font-size: 28px; color: #6b6b8a; font-weight: 400;">Sleep Better. Perform Better.</div>
      </div>

      <div style="text-align: center; width: 100%; margin-bottom: 100px;">
        <div style="font-size: 24px; color: #6b6b8a; text-transform: uppercase; letter-spacing: 5px; margin-bottom: 24px; font-weight: 500;">Recovery Score</div>
        <div style="font-size: 200px; font-weight: 800; color: ${getScoreColor(latestScore)}; line-height: 1; margin-bottom: 56px;">${latestScore}</div>

        <table style="width: 100%; border-spacing: 24px 0; border-collapse: separate;">
          <tr>
            <td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 36px 20px; text-align: center; width: 33%;">
              <div style="font-size: 52px; font-weight: 700; margin-bottom: 8px; color: white;">${avgScore}</div>
              <div style="font-size: 22px; color: #6b6b8a;">7-Day Avg</div>
            </td>
            <td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 36px 20px; text-align: center; width: 33%;">
              <div style="font-size: 52px; font-weight: 700; margin-bottom: 8px; color: white;">${formatDuration(avgDuration)}</div>
              <div style="font-size: 22px; color: #6b6b8a;">Avg Sleep</div>
            </td>
            <td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 36px 20px; text-align: center; width: 33%;">
              <div style="font-size: 52px; font-weight: 700; margin-bottom: 8px; color: white;">${currentStreak}</div>
              <div style="font-size: 22px; color: #6b6b8a;">Day Streak</div>
            </td>
          </tr>
        </table>
        ${trendHtml}
      </div>

      <div style="text-align: center; width: 100%; position: absolute; bottom: 100px; left: 0; right: 0;">
        <div style="font-size: 24px; color: #6b6b8a; margin-bottom: 8px;">Track your sleep recovery</div>
        <div style="font-size: 26px; color: #6366f1; font-weight: 600;">Download Recover on the App Store</div>
      </div>
    `;

    container.appendChild(story);
    document.body.appendChild(container);

    // Force layout computation
    story.getBoundingClientRect();

    try {
      const dataUrl = await htmlToImage.toPng(story, {
        width: 1080,
        height: 1920,
        quality: 1,
        pixelRatio: 1,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return { dataUrl, blob };
    } catch (error) {
      console.error('Error generating story:', error);
      return null;
    } finally {
      document.body.removeChild(container);
    }
  };

  // Share image via native share sheet
  const shareImageFile = async (blob: Blob, filename: string, text?: string) => {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        ...(text ? { text } : {}),
        files: [file],
      });
      return true;
    }
    return false;
  };

  // Handle Save - generate and show preview
  const handleSaveImage = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCardImage();
      if (result) {
        setPreviewImage({ ...result, mode: 'save' });
      }
    } catch (error) {
      console.error('Save image error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Messages share
  const handleMessagesShare = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCardImage();
      if (result) {
        const shared = await shareImageFile(result.blob, 'recover-stats.png', shareText);
        if (!shared) {
          const smsText = encodeURIComponent(shareText);
          window.location.href = `sms:?&body=${smsText}`;
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const smsText = encodeURIComponent(shareText);
        window.location.href = `sms:?&body=${smsText}`;
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Instagram Stories - generate story and show preview
  const handleInstagramShare = async () => {
    setIsGenerating(true);
    try {
      const result = await generateStoryImage();
      if (result) {
        setPreviewImage({ ...result, mode: 'instagram' });
      }
    } catch (error) {
      console.error('Instagram share error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Share from preview overlay using native share sheet
  const handlePreviewShare = async () => {
    if (!previewImage) return;
    try {
      const filename = previewImage.mode === 'instagram' ? 'recover-story.png' : 'recover-stats.png';
      await shareImageFile(previewImage.blob, filename);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

  // Handle Twitter/X share
  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(`My sleep stats from Recover:\n\nRecovery Score: ${latestScore}\n7-Day Average: ${avgScore}${currentStreak > 0 ? `\nStreak: ${currentStreak} days` : ''}\n\nTrack your sleep at ${APP_STORE_URL}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

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
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
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
                className="bg-gradient-to-br from-[#0a0a0f] to-[#12121a] rounded-xl border border-border p-4"
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
            <div className="px-4 pb-6">
              {isGenerating && (
                <div className="text-center py-2 mb-3">
                  <p className="text-sm text-text-muted">Generating image...</p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleSaveImage}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-secondary">Save</span>
                </button>
                <button
                  onClick={handleMessagesShare}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-secondary">Messages</span>
                </button>
                <button
                  onClick={handleInstagramShare}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
                >
                  <Instagram className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-secondary">Stories</span>
                </button>
                <button
                  onClick={handleTwitterShare}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
                >
                  <Twitter className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-secondary">Twitter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Overlay */}
      {previewImage && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 pt-safe">
            <button
              onClick={() => setPreviewImage(null)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-white/60 text-sm">Preview</p>
            <div className="w-10" />
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.dataUrl}
              alt="Recover Stats"
              className={`max-h-full rounded-xl object-contain ${previewImage.mode === 'instagram' ? 'max-w-[260px]' : 'max-w-full'}`}
            />
          </div>

          {/* Actions */}
          <div className="px-6 py-4 pb-safe space-y-3">
            <button
              onClick={handlePreviewShare}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-semibold text-base"
            >
              <Share2 className="w-5 h-5" />
              {previewImage.mode === 'instagram' ? 'Share to Instagram' : 'Save to Photos'}
            </button>
            <p className="text-white/40 text-xs text-center">
              {previewImage.mode === 'instagram'
                ? 'Select Instagram from the share menu'
                : 'Tap "Save Image" from the share menu'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
