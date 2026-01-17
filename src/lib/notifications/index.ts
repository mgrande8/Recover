import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendPushNotification } from '@/lib/push';

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

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendPush?: boolean; // Whether to also send a push notification
}

// Create a notification for a user
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, type, title, message, data = {}, sendPush = true } = params;

  // Create in-app notification
  const { error } = await getSupabaseAdmin()
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data,
    });

  if (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }

  // Send push notification if enabled
  if (sendPush) {
    try {
      await sendPushNotification(userId, {
        title,
        body: message,
        data: { type, ...data },
      });
    } catch (pushError) {
      // Log but don't throw - push failures shouldn't break the app
      console.error('Failed to send push notification:', pushError);
    }
  }
}

// Create a streak celebration notification
export async function createStreakNotification(userId: string, streak: number): Promise<void> {
  const milestones: Record<number, { emoji: string; title: string; message: string }> = {
    3: {
      emoji: '🔥',
      title: '3-Day Streak!',
      message: 'You\'re building a habit. Keep logging to maintain your streak!',
    },
    7: {
      emoji: '⭐',
      title: 'One Week Streak!',
      message: 'Amazing! You\'ve logged your sleep for a whole week. You\'re on fire!',
    },
    14: {
      emoji: '🏆',
      title: '2-Week Champion!',
      message: 'Two weeks of consistent tracking! You\'re a sleep tracking champion!',
    },
    30: {
      emoji: '👑',
      title: '30-Day Master!',
      message: 'Incredible! A whole month of sleep tracking. You\'ve mastered the habit!',
    },
  };

  const milestone = milestones[streak];
  if (!milestone) return;

  await createNotification({
    userId,
    type: 'streak',
    title: `${milestone.emoji} ${milestone.title}`,
    message: milestone.message,
    data: { streak },
  });
}

// Create a Pro upgrade notification
export async function createProUpgradeNotification(
  userId: string,
  plan: 'monthly' | 'annual'
): Promise<void> {
  await createNotification({
    userId,
    type: 'pro_upgrade',
    title: '🎉 Welcome to Recover Pro!',
    message: `You now have access to all premium features including Sleep Banking, AI Insights, and Correlation Analysis.`,
    data: { plan },
  });
}

// Get user's streak info
export async function getUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number } | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
  };
}
