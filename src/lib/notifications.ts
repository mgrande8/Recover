import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendPushNotification } from '@/lib/push';
import type { NotificationType } from '@/types';

// Create an in-app notification and optionally send push
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, unknown> = {},
  sendPush: boolean = true
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Create in-app notification
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data,
    read: false,
  });

  if (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }

  // Send push notification if enabled
  if (sendPush) {
    try {
      await sendPushNotification(userId, { title, body: message, data });
    } catch (pushError) {
      console.error('Failed to send push notification:', pushError);
      // Don't throw - in-app notification was created
    }
  }
}

// Streak celebration notification
export async function createStreakNotification(
  userId: string,
  streak: number
): Promise<void> {
  const messages: Record<number, { title: string; message: string }> = {
    3: {
      title: '3-Day Streak!',
      message: "You're building a great habit! Keep logging your sleep.",
    },
    7: {
      title: '1 Week Streak!',
      message: 'One full week of tracking! Your sleep data is getting valuable.',
    },
    14: {
      title: '2 Week Streak!',
      message: "Two weeks strong! You're committed to better sleep.",
    },
    30: {
      title: '30-Day Streak!',
      message: 'Amazing! A full month of sleep tracking. You deserve this win.',
    },
  };

  const content = messages[streak] || {
    title: `${streak}-Day Streak!`,
    message: `Incredible! You've logged your sleep for ${streak} days in a row.`,
  };

  await createNotification(userId, 'streak', content.title, content.message, { streak });
}

// Daily reminder notification
export async function createReminderNotification(userId: string): Promise<void> {
  await createNotification(
    userId,
    'reminder',
    'Time to Log Your Sleep',
    "Don't forget to log last night's sleep to keep your streak going!",
    { type: 'daily_reminder' }
  );
}

// Pro upgrade notification
export async function createProUpgradeNotification(
  userId: string,
  plan?: string
): Promise<void> {
  const planText = plan === 'yearly' ? 'annual' : 'monthly';
  await createNotification(
    userId,
    'pro_upgrade',
    'Welcome to Pro!',
    `You now have access to advanced insights, sleep banking, and correlation analysis. Your ${planText} subscription is active.`,
    { type: 'pro_upgrade', plan }
  );
}

// Weekly summary notification
export async function createWeeklySummaryNotification(
  userId: string,
  stats: {
    avgDuration: number;
    avgQuality: number;
    streak: number;
    logsCount: number;
  }
): Promise<void> {
  const avgHours = (stats.avgDuration / 60).toFixed(1);
  const qualityText = stats.avgQuality >= 4 ? 'Great' : stats.avgQuality >= 3 ? 'Good' : 'Fair';

  await createNotification(
    userId,
    'weekly_summary',
    'Your Weekly Sleep Summary',
    `This week: ${avgHours}h avg sleep, ${qualityText} quality, ${stats.logsCount} nights logged.`,
    stats
  );
}

// Get users who need daily reminders
export async function getUsersForDailyReminder(): Promise<
  { id: string; reminder_time: string }[]
> {
  const supabase = getSupabaseAdmin();

  // Get users who have reminders enabled and haven't logged today
  const today = new Date().toISOString().split('T')[0];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, reminder_time')
    .eq('email_reminders', true)
    .eq('push_notifications_enabled', true);

  if (error) {
    console.error('Failed to get users for reminder:', error);
    return [];
  }

  // Filter to users who haven't logged today
  const usersToRemind: { id: string; reminder_time: string }[] = [];

  for (const profile of profiles || []) {
    const { data: todayLog } = await supabase
      .from('sleep_logs')
      .select('id')
      .eq('user_id', profile.id)
      .eq('date', today)
      .eq('is_nap', false)
      .single();

    if (!todayLog) {
      usersToRemind.push(profile);
    }
  }

  return usersToRemind;
}

// Get users for weekly summary (run on Sundays)
export async function getUsersForWeeklySummary(): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email_weekly_summary', true)
    .eq('push_notifications_enabled', true);

  if (error) {
    console.error('Failed to get users for weekly summary:', error);
    return [];
  }

  return (profiles || []).map((p) => p.id);
}

// Calculate weekly stats for a user
export async function calculateWeeklyStats(userId: string): Promise<{
  avgDuration: number;
  avgQuality: number;
  streak: number;
  logsCount: number;
} | null> {
  const supabase = getSupabaseAdmin();

  // Get last 7 days of sleep logs (excluding naps)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: logs, error: logsError } = await supabase
    .from('sleep_logs')
    .select('duration_minutes, quality')
    .eq('user_id', userId)
    .eq('is_nap', false)
    .gte('date', weekAgo.toISOString().split('T')[0]);

  if (logsError || !logs || logs.length === 0) {
    return null;
  }

  // Get current streak
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .single();

  const totalDuration = logs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const totalQuality = logs.reduce((sum, log) => sum + log.quality, 0);

  return {
    avgDuration: totalDuration / logs.length,
    avgQuality: totalQuality / logs.length,
    streak: streakData?.current_streak || 0,
    logsCount: logs.length,
  };
}
