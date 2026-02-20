'use client';

import { useEffect, useState } from 'react';
import { X, Target, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { SleepLog, Profile } from '@/types';

const STORAGE_KEY = 'recover_goal_refinement';

interface SleepGoalRefinementProps {
  sleepLogs: SleepLog[];
  profile: Profile;
}

export function SleepGoalRefinement({ sleepLogs, profile }: SleepGoalRefinementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(profile.sleep_goal_hours);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only show for night logs
    const nightLogs = sleepLogs.filter((log) => !log.is_nap);
    if (nightLogs.length < 7) return;

    // Check if already seen
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen) return;
    } catch {
      return;
    }

    // Calculate average duration
    const avgDuration = nightLogs.slice(0, 14).reduce((sum, log) => sum + log.duration_minutes, 0) / Math.min(nightLogs.length, 14);
    const avgHours = avgDuration / 60;
    const goalHours = profile.sleep_goal_hours;

    // Only show if avg differs from goal by > 30 min
    if (Math.abs(avgHours - goalHours) <= 0.5) return;

    // Suggest a goal rounded to nearest 0.5h
    const suggestedGoal = Math.round(avgHours * 2) / 2;
    setNewGoal(suggestedGoal);

    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [sleepLogs, profile]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {}
    setIsOpen(false);
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ sleep_goal_hours: newGoal })
        .eq('id', profile.id);

      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const nightLogs = sleepLogs.filter((log) => !log.is_nap);
  const avgDuration = nightLogs.slice(0, 14).reduce((sum, log) => sum + log.duration_minutes, 0) / Math.min(nightLogs.length, 14);
  const avgHours = Math.floor(avgDuration / 60);
  const avgMins = Math.round(avgDuration % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleDismiss} />

      <div className="relative bg-card rounded-2xl border border-border w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 py-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-2">Refine Your Sleep Goal</h2>
          <p className="text-text-secondary text-sm mb-6">
            Based on your first week, you&apos;re averaging{' '}
            <span className="font-semibold text-text-primary">{avgHours}h {avgMins > 0 ? `${avgMins}m` : ''}</span>.
            Your current goal is{' '}
            <span className="font-semibold text-text-primary">{profile.sleep_goal_hours}h</span>.
            Would you like to adjust?
          </p>

          {/* Goal selector */}
          <div className="bg-background rounded-xl p-4 mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-3">New Goal</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setNewGoal(Math.max(5, newGoal - 0.5))}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-4xl font-bold text-text-primary min-w-[80px]">
                {newGoal}h
              </span>
              <button
                onClick={() => setNewGoal(Math.min(12, newGoal + 0.5))}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleUpdate} className="w-full" isLoading={isSaving}>
              Update Goal
            </Button>
            <Button onClick={handleDismiss} variant="ghost" className="w-full">
              Keep Current
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
