'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateChecklistStreak } from '@/lib/checklist-streaks';
import type { ChecklistLog } from '@/types';

export function ChecklistStreakWidget() {
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number } | null>(null);

  useEffect(() => {
    const loadStreak = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data } = await supabase
        .from('checklist_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (data) {
        setStreak(calculateChecklistStreak(data as ChecklistLog[]));
      }
    };

    loadStreak();
  }, []);

  if (!streak || streak.currentStreak === 0) return null;

  const isPersonalBest = streak.currentStreak >= streak.longestStreak && streak.longestStreak > 1;

  return (
    <div className="bg-card rounded-xl border border-border p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {streak.currentStreak}-day checklist streak
            </p>
            <p className="text-xs text-text-muted">
              {streak.currentStreak >= 6 ? '6+' : '6+'} items completed each day
            </p>
          </div>
        </div>
        {isPersonalBest && (
          <div className="flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-full">
            <Trophy className="w-3 h-3 text-warning" />
            <span className="text-xs font-medium text-warning">Best</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Small badge version for dashboard
export function ChecklistStreakBadge({ currentStreak }: { currentStreak: number }) {
  if (currentStreak === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium">
      <Flame className="w-3 h-3" />
      {currentStreak}
    </span>
  );
}
