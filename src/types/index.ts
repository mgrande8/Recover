// User profile types
export type UserType = 'athlete' | 'professional' | 'parent' | 'general';
export type Goal = 'energy' | 'focus' | 'performance' | 'consistency';

export interface Profile {
  id: string;
  email: string | null;
  user_type: UserType;
  goal: Goal;
  typical_bedtime: string; // TIME format "HH:MM"
  typical_wake_time: string; // TIME format "HH:MM"
  sleep_goal_hours: number;
  is_pro: boolean;
  pro_expires_at: string | null;
  created_at: string;
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
  user_type?: UserType;
  goal?: Goal;
  typical_bedtime?: string;
  typical_wake_time?: string;
  sleep_goal_hours?: number;
}
