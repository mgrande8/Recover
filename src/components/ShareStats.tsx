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
  Check,
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ dataUrl: string; mode: 'save' | 'instagram' } | null>(null);
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

  // Share text
  const shareText = `My sleep stats from Recover:\n\nRecovery Score: ${latestScore}\n7-Day Average: ${avgScore}${currentStreak > 0 ? `\nStreak: ${currentStreak} days` : ''}\n\nTrack your sleep with Recover\n${APP_STORE_URL}`;

  // Generate image from card
  const generateImage = async (width?: number, height?: number): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.backgroundColor = '#0a0a0f';
      clone.style.padding = '24px';
      clone.style.borderRadius = '16px';

      if (width && height) {
        const wrapper = document.createElement('div');
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;
        wrapper.style.backgroundColor = '#0a0a0f';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.padding = '80px';

        clone.style.width = '100%';
        clone.style.maxWidth = '920px';
        clone.style.transform = 'scale(1)';

        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        const dataUrl = await htmlToImage.toPng(wrapper, {
          width,
          height,
          quality: 1,
          pixelRatio: 2,
        });

        document.body.removeChild(wrapper);

        const response = await fetch(dataUrl);
        return await response.blob();
      } else {
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#0a0a0f',
        });

        const response = await fetch(dataUrl);
        return await response.blob();
      }
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  // Share using native share sheet (works in iOS WKWebView)
  const nativeShare = async (blob: Blob, filename: string, text?: string) => {
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

  // Convert blob to data URL
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fallback download for desktop browsers
  const downloadImage = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Save as Image - shows preview for long-press save on iOS
  const handleSaveImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const dataUrl = await blobToDataUrl(blob);
        setPreviewImage({ dataUrl, mode: 'save' });
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
      const blob = await generateImage();
      if (blob) {
        const shared = await nativeShare(blob, 'recover-stats.png', shareText);
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

  // Handle Instagram Stories - shows preview for long-press save, then open Instagram
  const handleInstagramShare = async () => {
    setIsGenerating(true);
    try {
      // Generate Stories-sized image (1080x1920)
      const blob = await generateImage(1080, 1920);
      if (blob) {
        const dataUrl = await blobToDataUrl(blob);
        setPreviewImage({ dataUrl, mode: 'instagram' });
      }
    } catch (error) {
      console.error('Instagram share error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Instagram app
  const openInstagram = () => {
    window.location.href = 'instagram://app';
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

              {saveSuccess && (
                <div className="flex items-center justify-center gap-2 py-2 mb-3 text-success">
                  <Check className="w-4 h-4" />
                  <p className="text-sm font-medium">Image ready!</p>
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

      {/* Image Preview Overlay - for long-press save on iOS */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewImage(null);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10 pt-safe"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Instructions */}
          <p className="text-white/90 text-sm font-medium mb-4 text-center pt-safe">
            {previewImage.mode === 'instagram'
              ? 'Long press image to save, then tap Open Instagram'
              : 'Long press the image to save to Photos'}
          </p>

          {/* The generated image */}
          <div className={`flex-1 flex items-center justify-center w-full ${previewImage.mode === 'instagram' ? 'max-w-[270px]' : 'max-w-sm'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.dataUrl}
              alt="Recover Stats"
              className="max-w-full max-h-full rounded-xl object-contain"
              style={{ WebkitTouchCallout: 'default' }}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3 pb-safe">
            {previewImage.mode === 'instagram' && (
              <button
                onClick={openInstagram}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium"
              >
                <Instagram className="w-5 h-5" />
                Open Instagram
              </button>
            )}
            <button
              onClick={() => setPreviewImage(null)}
              className="px-6 py-3 bg-white/10 text-white rounded-full font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
