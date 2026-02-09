import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendPushNotification } from '@/lib/push';

// Debug endpoint to check notification setup for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();

    // Get user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, name, reminder_time, timezone, push_notifications_enabled, email_reminders')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to get profile', details: profileError }, { status: 500 });
    }

    // Get device tokens
    const { data: tokens, error: tokensError } = await adminSupabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', user.id);

    // Check current hour in user's timezone
    const timezone = profile?.timezone || 'America/New_York';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const currentTimeInTz = formatter.format(now);
    const currentHour = parseInt(currentTimeInTz.split(':')[0], 10);

    const reminderTime = profile?.reminder_time || '10:00';
    const reminderHour = parseInt(reminderTime.split(':')[0], 10);

    // Check if user logged today
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayInTz = dateFormatter.format(now);

    const { data: todayLog } = await adminSupabase
      .from('sleep_logs')
      .select('id, date')
      .eq('user_id', user.id)
      .eq('date', todayInTz)
      .eq('is_nap', false)
      .single();

    // Check recent notifications
    const { data: recentNotifications } = await adminSupabase
      .from('notifications')
      .select('id, type, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        name: profile?.name,
        timezone,
        reminderTime,
        pushNotificationsEnabled: profile?.push_notifications_enabled,
        emailReminders: profile?.email_reminders,
      },
      timing: {
        serverTimeUTC: now.toISOString(),
        currentTimeInUserTz: currentTimeInTz,
        currentHour,
        reminderHour,
        hoursUntilReminder: reminderHour > currentHour
          ? reminderHour - currentHour
          : (24 - currentHour) + reminderHour,
        wouldTriggerNow: currentHour === reminderHour,
      },
      sleepLog: {
        todayDate: todayInTz,
        hasLoggedToday: !!todayLog,
      },
      deviceTokens: {
        count: tokens?.length || 0,
        tokens: tokens?.map(t => ({
          platform: t.platform,
          lastUsed: t.last_used_at,
          tokenPreview: t.token?.substring(0, 20) + '...',
        })),
      },
      recentNotifications: recentNotifications?.map(n => ({
        type: n.type,
        title: n.title,
        createdAt: n.created_at,
      })),
      diagnosis: getDiagnosis(profile, tokens, currentHour, reminderHour, todayLog),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Debug failed', details: String(error) }, { status: 500 });
  }
}

function getDiagnosis(
  profile: any,
  tokens: any[] | null,
  currentHour: number,
  reminderHour: number,
  todayLog: any
): string[] {
  const issues: string[] = [];

  if (!profile?.push_notifications_enabled && !profile?.email_reminders) {
    issues.push('ISSUE: Both push notifications and email reminders are disabled. Enable at least one in Settings.');
  }

  if (!tokens || tokens.length === 0) {
    issues.push('ISSUE: No device tokens registered. Open the app on your phone to register for push notifications.');
  }

  if (todayLog) {
    issues.push('INFO: You already logged sleep today, so no reminder will be sent.');
  }

  if (currentHour !== reminderHour) {
    issues.push(`INFO: Current hour (${currentHour}) does not match reminder hour (${reminderHour}). Reminder will trigger at ${reminderHour}:00.`);
  }

  if (issues.length === 0) {
    issues.push('OK: Everything looks good! You should receive a reminder at your scheduled time if you haven\'t logged sleep.');
  }

  return issues;
}

// POST to force send a reminder notification to yourself
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sendPushNotification(user.id, {
      title: 'Time to Log Your Sleep',
      body: "Don't forget to log last night's sleep to keep your streak going!",
      data: { type: 'daily_reminder' },
    });

    return NextResponse.json({
      message: 'Reminder notification sent',
      ...result,
    });
  } catch (error) {
    console.error('Force reminder error:', error);
    return NextResponse.json({ error: 'Failed to send reminder', details: String(error) }, { status: 500 });
  }
}
