// User profile types
export type UserType = 'athlete' | 'professional' | 'parent' | 'general';
export type Goal = 'energy' | 'focus' | 'performance' | 'consistency';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  user_type: UserType;
  goal: Goal;
  typical_bedtime: string; // TIME format "HH:MM"
  typical_wake_time: string; // TIME format "HH:MM"
  sleep_goal_hours: number;
  is_pro: boolean;
  pro_expires_at: string | null;
  // Notification preferences
  email_weekly_summary: boolean;
  email_streak_celebrations: boolean;
  email_reminders: boolean;
  push_notifications_enabled: boolean;
  reminder_time: string; // TIME format "HH:MM"
  created_at: string;
  updated_at: string;
}

// Notification types
export type NotificationType = 'streak' | 'achievement' | 'reminder' | 'weekly_summary' | 'pro_upgrade' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  streak_started_at: string | null;
  updated_at: string;
}

// Sleep log types
export interface SleepLog {
  id: string;
  user_id: string;
  date: string; // DATE format "YYYY-MM-DD"
  bedtime: string; // TIMESTAMP
  wake_time: string; // TIMESTAMP
  duration_minutes: number;
  quality: number; // 1-5
  energy: number; // 1-5
  interruptions: number; // 0, 1, 2, 3+
  notes: string | null;
  is_nap: boolean; // true for naps, false for night sleep
  created_at: string;
}

// Checklist types
export interface ChecklistLog {
  id: string;
  user_id: string;
  date: string;
  exercised: boolean;
  no_caffeine_after_2pm: boolean;
  no_alcohol: boolean;
  no_heavy_meal: boolean;
  room_dark: boolean;
  room_cool: boolean;
  screens_off_30min: boolean;
  phone_not_in_bed: boolean;
  created_at: string;
}

// Recovery score types
export type RecoveryLevel = 'fully-recovered' | 'recovered' | 'adequate' | 'under-recovered';

export interface RecoveryScore {
  score: number;
  level: RecoveryLevel;
  message: string;
}

// Form input types for creating/updating records
export interface SleepLogInput {
  date: string;
  bedtime: string;
  wake_time: string;
  quality: number;
  energy: number;
  interruptions: number;
  notes?: string;
  is_nap?: boolean;
}

export interface ChecklistInput {
  date: string;
  exercised?: boolean;
  no_caffeine_after_2pm?: boolean;
  no_alcohol?: boolean;
  no_heavy_meal?: boolean;
  room_dark?: boolean;
  room_cool?: boolean;
  screens_off_30min?: boolean;
  phone_not_in_bed?: boolean;
}

export interface ProfileInput {
  name?: string;
  user_type?: UserType;
  goal?: Goal;
  typical_bedtime?: string;
  typical_wake_time?: string;
  sleep_goal_hours?: number;
}
