'use client';

import { useEffect, useState } from 'react';
import { Star, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui';

const APP_STORE_REVIEW_URL = 'https://apps.apple.com/app/id6758255662?action=write-review';
const STORAGE_KEY = 'recover_review';
const MIN_STREAK = 7;
const COOLDOWN_DAYS = 90;

interface ReviewPromptProps {
  currentStreak: number;
}

export function ReviewPrompt({ currentStreak }: ReviewPromptProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentStreak < MIN_STREAK) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // User said "Don't ask again"
        if (data.neverAsk) return;

        // Already rated
        if (data.rated) return;

        // Shown recently (within cooldown)
        if (data.lastShown) {
          const daysSince = (Date.now() - data.lastShown) / (1000 * 60 * 60 * 24);
          if (daysSince < COOLDOWN_DAYS) return;
        }
      }

      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    } catch {
      // localStorage not available
    }
  }, [currentStreak]);

  const handleRate = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rated: true, lastShown: Date.now() }));
    } catch {}
    window.open(APP_STORE_REVIEW_URL, '_blank');
    setIsOpen(false);
  };

  const handleNotNow = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastShown: Date.now() }));
    } catch {}
    setIsOpen(false);
  };

  const handleNeverAsk = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ neverAsk: true }));
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleNotNow}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleNotNow}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-indigo-600 px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <h2 className="text-xl font-bold text-white">Enjoying Recover?</h2>
          <p className="text-white/80 text-sm mt-1">
            You&apos;re on a {currentStreak}-day streak!
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary text-center text-sm mb-6">
            Your dedication to better sleep is inspiring. A quick rating on the App Store helps others discover Recover too.
          </p>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleRate}
              size="lg"
              className="w-full"
            >
              <Heart className="w-5 h-5 mr-2" />
              Rate Recover
            </Button>
            <Button
              onClick={handleNotNow}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Maybe Later
            </Button>
            <button
              onClick={handleNeverAsk}
              className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
            >
              Don&apos;t ask again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
