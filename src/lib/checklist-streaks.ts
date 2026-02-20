import type { ChecklistLog } from '@/types';

const CHECKLIST_ITEMS = [
  'exercised',
  'no_caffeine_after_2pm',
  'no_alcohol',
  'no_heavy_meal',
  'room_dark',
  'room_cool',
  'screens_off_30min',
  'phone_not_in_bed',
] as const;

export function calculateChecklistStreak(
  checklistLogs: ChecklistLog[],
  threshold = 6
): { currentStreak: number; longestStreak: number } {
  if (checklistLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort by date descending
  const sorted = [...checklistLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  for (const log of sorted) {
    const checkedCount = CHECKLIST_ITEMS.filter(
      (key) => log[key as keyof ChecklistLog] === true
    ).length;

    const logDate = new Date(log.date);

    if (checkedCount >= threshold) {
      if (prevDate === null) {
        // First qualifying day
        streak = 1;
      } else {
        // Check if consecutive (allow for 1 day gap due to date math)
        const diffDays = Math.round(
          (prevDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          streak++;
        } else {
          // Gap — start new streak
          streak = 1;
        }
      }
      prevDate = logDate;
    } else {
      // Didn't meet threshold — break streak
      if (currentStreak === 0) {
        currentStreak = streak;
      }
      streak = 0;
      prevDate = null;
    }

    longestStreak = Math.max(longestStreak, streak);
  }

  // If we never broke the streak, the current streak is the ongoing one
  if (currentStreak === 0) {
    currentStreak = streak;
  }

  return { currentStreak, longestStreak };
}
