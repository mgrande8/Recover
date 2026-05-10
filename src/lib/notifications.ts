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

// Check if user has already rated the app
async function hasUserRatedApp(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('has_rated_app')
    .eq('id', userId)
    .single();

  return data?.has_rated_app === true;
}

// Streak celebration notification
export async function createStreakNotification(
  userId: string,
  streak: number
): Promise<void> {
  // Check if user has rated for review-related streaks (7 and 14)
  const hasRated = (streak === 7 || streak === 14) ? await hasUserRatedApp(userId) : false;

  // Messages with review prompts for 7 and 14 day (if not rated)
  const messages: Record<number, { title: string; message: string }> = {
    3: {
      title: '🔥 3-Day Streak!',
      message: "You're building a great habit! Keep logging your sleep.",
    },
    7: {
      title: '⭐ 7-Day Streak!',
      message: hasRated
        ? 'One full week of consistent tracking! Your sleep data is getting valuable.'
        : 'One full week! Loving Recover? A quick App Store rating helps others find us.',
    },
    14: {
      title: '⭐ 14-Day Streak!',
      message: hasRated
        ? "Two weeks strong! You're committed to better sleep."
        : "Two weeks strong! If you're enjoying Recover, please take a moment to rate us on the App Store.",
    },
    30: {
      title: '🏆 30-Day Streak!',
      message: 'Amazing! A full month of sleep tracking. You deserve this win.',
    },
    60: {
      title: '🏆 60-Day Streak!',
      message: 'Two months of consistency! Your sleep patterns are well-documented.',
    },
    90: {
      title: '👑 90-Day Streak!',
      message: 'Three months straight! Sleep tracking is part of your routine now.',
    },
    100: {
      title: '👑 100-Day Streak!',
      message: 'Triple digits! 100 days of dedication to better sleep.',
    },
    365: {
      title: '🎉 365-Day Streak!',
      message: "A full year of sleep tracking! You're an absolute legend.",
    },
  };

  const content = messages[streak] || {
    title: `${streak}-Day Streak!`,
    message: `Incredible! You've logged your sleep for ${streak} days in a row.`,
  };

  await createNotification(userId, 'streak', content.title, content.message, { streak });
}

// Reminder copy variants per user_type. Title + body tuned to the segment the
// user picked in onboarding so the daily nudge feels written for them.
const REMINDER_COPY: Record<
  'athlete' | 'professional' | 'parent' | 'general',
  { title: string; message: string }
> = {
  athlete: {
    title: 'How did recovery feel?',
    message: "Log last night's sleep to track how it's affecting training.",
  },
  professional: {
    title: 'Quick sleep check',
    message: "Log last night to keep your energy and focus trends accurate.",
  },
  parent: {
    title: 'Got a moment?',
    message: 'Log how the night went — every data point helps spot patterns.',
  },
  general: {
    title: 'Time to log your sleep',
    message: "Don't forget to log last night's sleep to keep your streak going!",
  },
};

// Daily reminder notification (with duplicate prevention)
export async function createReminderNotification(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Check if we already sent a reminder today to prevent duplicates
  const today = new Date().toISOString().split('T')[0];
  const { data: existingReminder } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'reminder')
    .gte('created_at', `${today}T00:00:00Z`)
    .limit(1)
    .single();

  if (existingReminder) {
    console.log(`Skipping duplicate reminder for user ${userId} - already sent today`);
    return;
  }

  // Pull user_type to pick a copy variant. Falls back to 'general' if unset.
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single();

  const variant = (profile?.user_type as keyof typeof REMINDER_COPY) || 'general';
  const copy = REMINDER_COPY[variant] || REMINDER_COPY.general;

  await createNotification(
    userId,
    'reminder',
    copy.title,
    copy.message,
    { type: 'daily_reminder', variant }
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

// Pro expired / cancelled re-subscription notification
export async function createProExpiredNotification(
  userId: string
): Promise<void> {
  await createNotification(
    userId,
    'pro_expired',
    'We miss you!',
    'Your Pro insights are waiting. Resubscribe to unlock sleep debt tracking, correlation analysis, and personalized recommendations.',
    { type: 'pro_expired' }
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

// Monthly report notification
export async function createMonthlyReportNotification(
  userId: string,
  reportId: string
): Promise<void> {
  await createNotification(
    userId,
    'monthly_report',
    'Your 30-Day Sleep Report is Ready',
    'Tap to see your personalized sleep analysis and recommendations.',
    { reportId, type: 'monthly_report' }
  );
}

// Smart bedtime reminder notification
export async function createSmartBedtimeNotification(
  userId: string
): Promise<void> {
  await createNotification(
    userId,
    'reminder',
    'Wind-Down Time',
    'Your optimal bedtime is in 30 minutes. Start your wind-down routine.',
    { type: 'smart_bedtime' }
  );
}

// Helper to get current hour in a timezone
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    // Default to UTC if timezone is invalid
    return new Date().getUTCHours();
  }
}

// Helper to get today's date in a timezone
function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // Returns YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Get users who need daily reminders right now.
// Cron fires hourly — we only return users whose reminder_time hour matches
// the current hour in their timezone, so each user gets pinged at their own
// preferred local time instead of a global UTC moment.
export async function getUsersForDailyReminder(): Promise<
  { id: string; reminder_time: string }[]
> {
  const supabase = getSupabaseAdmin();

  // Get users who have push notifications enabled
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, reminder_time, timezone, push_notifications_enabled')
    .eq('push_notifications_enabled', true);

  if (error) {
    console.error('[Reminder] Failed to get users for reminder:', error);
    return [];
  }

  console.log(`[Reminder] Found ${profiles?.length || 0} users with push notifications enabled`);

  const usersToRemind: { id: string; reminder_time: string }[] = [];

  for (const profile of profiles || []) {
    const timezone = profile.timezone || 'America/New_York';
    const reminderTime = profile.reminder_time || '10:00';
    const reminderHour = parseInt(reminderTime.split(':')[0], 10);
    const currentHour = getCurrentHourInTimezone(timezone);

    // Only ping during the user's chosen reminder hour (in their TZ)
    if (currentHour !== reminderHour) {
      continue;
    }

    // And only if they haven't logged today (in their timezone)
    const todayInUserTz = getTodayInTimezone(timezone);
    const { data: todayLog } = await supabase
      .from('sleep_logs')
      .select('id')
      .eq('user_id', profile.id)
      .eq('date', todayInUserTz)
      .eq('is_nap', false)
      .single();

    if (todayLog) {
      console.log(`[Reminder] User ${profile.id}: Skipping - already logged today (${todayInUserTz})`);
    } else {
      console.log(
        `[Reminder] User ${profile.id}: In window (${reminderTime} ${timezone}), no log for ${todayInUserTz} - adding`
      );
      usersToRemind.push({ id: profile.id, reminder_time: reminderTime });
    }
  }

  console.log(`[Reminder] Total users to remind this hour: ${usersToRemind.length}`);
  return usersToRemind;
}

// Get users for weekly summary (run on Sundays at their reminder time)
export async function getUsersForWeeklySummary(): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  // Get users who have either email weekly summary OR push notifications enabled
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, reminder_time, timezone')
    .or('email_weekly_summary.eq.true,push_notifications_enabled.eq.true');

  if (error) {
    console.error('Failed to get users for weekly summary:', error);
    return [];
  }

  // Filter to users where it's currently their reminder hour
  const usersToNotify: string[] = [];

  for (const profile of profiles || []) {
    const timezone = profile.timezone || 'America/New_York';
    const reminderHour = parseInt((profile.reminder_time || '10:00').split(':')[0], 10);
    const currentHour = getCurrentHourInTimezone(timezone);

    // Only send if current hour matches reminder hour
    if (currentHour === reminderHour) {
      usersToNotify.push(profile.id);
    }
  }

  return usersToNotify;
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
