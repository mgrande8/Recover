import { SleepLog, Profile, RecoveryScore, RecoveryLevel } from '@/types';

/**
 * Calculate the Recovery Score (0-100) based on sleep data
 *
 * Components:
 * - Duration: 40 points max (based on sleep goal)
 * - Quality: 30 points max
 * - Energy: 20 points max
 * - Interruptions: -10 points max penalty
 */
export function calculateRecoveryScore(sleepLog: SleepLog, profile: Profile): RecoveryScore {
  let score = 0;

  // Duration component (40 points max)
  const targetMinutes = profile.sleep_goal_hours * 60;
  const durationRatio = Math.min(sleepLog.duration_minutes / targetMinutes, 1.2);
  score += durationRatio * 33.33; // Max ~40 points

  // Quality component (30 points max)
  score += (sleepLog.quality / 5) * 30;

  // Energy component (20 points max)
  score += (sleepLog.energy / 5) * 20;

  // Interruptions penalty (up to -10 points)
  const interruptionPenalty = Math.min(sleepLog.interruptions * 3.33, 10);
  score -= interruptionPenalty;

  // Clamp between 0-100
  const finalScore = Math.round(Math.max(0, Math.min(100, score)));

  // Determine recovery level and message
  const { level, message } = getRecoveryLevel(finalScore);

  return {
    score: finalScore,
    level,
    message,
  };
}

/**
 * Get recovery level and message based on score
 */
export function getRecoveryLevel(score: number): { level: RecoveryLevel; message: string } {
  if (score >= 85) {
    return {
      level: 'fully-recovered',
      message: 'Fully Recovered — Ready for high intensity',
    };
  } else if (score >= 70) {
    return {
      level: 'recovered',
      message: 'Recovered — Good for normal activity',
    };
  } else if (score >= 50) {
    return {
      level: 'adequate',
      message: 'Adequate — Take it easy if possible',
    };
  } else {
    return {
      level: 'under-recovered',
      message: 'Under-recovered — Prioritize rest',
    };
  }
}

/**
 * Get color class for recovery level
 */
export function getRecoveryColor(level: RecoveryLevel): string {
  switch (level) {
    case 'fully-recovered':
    case 'recovered':
      return 'text-success';
    case 'adequate':
      return 'text-warning';
    case 'under-recovered':
      return 'text-danger';
    default:
      return 'text-text-secondary';
  }
}

/**
 * Get background color class for recovery level
 */
export function getRecoveryBgColor(level: RecoveryLevel): string {
  switch (level) {
    case 'fully-recovered':
    case 'recovered':
      return 'bg-success';
    case 'adequate':
      return 'bg-warning';
    case 'under-recovered':
      return 'bg-danger';
    default:
      return 'bg-text-secondary';
  }
}

/**
 * Calculate duration in minutes between two timestamps
 */
export function calculateDurationMinutes(bedtime: string, wakeTime: string): number {
  const bed = new Date(bedtime);
  const wake = new Date(wakeTime);
  const diffMs = wake.getTime() - bed.getTime();
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Format duration in minutes to hours and minutes string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display (e.g., "10:30 PM")
 */
export function formatTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Check if a user profile has active Pro status
 * Validates both the is_pro flag and expiration date
 */
export function checkIsPro(profile: { is_pro?: unknown; pro_expires_at?: string | null }): boolean {
  const isProFlag = !!profile.is_pro && profile.is_pro !== 'false' && (profile.is_pro as unknown) !== 0;
  const proNotExpired = !profile.pro_expires_at || new Date(profile.pro_expires_at) > new Date();
  return isProFlag && proNotExpired;
}

/**
 * Combine utility classes (like clsx/cn)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
