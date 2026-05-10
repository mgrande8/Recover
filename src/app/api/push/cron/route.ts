import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  getUsersForDailyReminder,
  getUsersForWeeklySummary,
  calculateWeeklyStats,
  createReminderNotification,
  createWeeklySummaryNotification,
  createMonthlyReportNotification,
  createSmartBedtimeNotification,
} from '@/lib/notifications';
import { getUsersForMonthlyReport, createMonthlyReport } from '@/lib/reports/monthly';
import { getUsersForSmartReminder } from '@/lib/sleep-analysis';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SleepLog, ChecklistLog, MonthlyReport, SleepLogTag } from '@/types';

// Verify the request is from a trusted source (Vercel Cron or similar)
function verifyRequest(headersList: Headers): boolean {
  // Vercel Cron jobs include this header or user-agent
  const vercelCronHeader = headersList.get('x-vercel-cron');
  const userAgent = headersList.get('user-agent') || '';

  if (vercelCronHeader || userAgent.includes('vercel-cron')) {
    console.log('[Cron] Verified as Vercel cron job');
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;

  // Check for authorization header with secret
  if (cronSecret) {
    const authHeader = headersList.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) {
      return true;
    }
  }

  console.error('[Cron] Unauthorized request - not from Vercel cron');
  return false;
}

// Daily reminder handler - run at evening (e.g., 8 PM)
export async function GET(request: Request) {
  const headersList = await headers();

  if (!verifyRequest(headersList)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'daily';

  try {
    if (type === 'daily') {
      return await handleDailyReminders();
    } else if (type === 'weekly') {
      return await handleWeeklySummary();
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleDailyReminders(): Promise<NextResponse> {
  console.log(`[Cron] Daily reminder job started at ${new Date().toISOString()}`);

  const users = await getUsersForDailyReminder();
  console.log(`[Cron] Found ${users.length} users to remind`);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      console.log(`[Cron] Sending reminder to user ${user.id}`);
      await createReminderNotification(user.id);
      sent++;
      console.log(`[Cron] Successfully sent reminder to user ${user.id}`);
    } catch (error) {
      console.error(`[Cron] Failed to send reminder to user ${user.id}:`, error);
      failed++;
    }
  }

  console.log(`[Cron] Daily reminders complete: ${sent} sent, ${failed} failed, ${users.length} total`);

  // Piggyback monthly report generation on daily cron
  const monthlyResults = await handleMonthlyReports();

  // Piggyback smart bedtime reminders on daily cron
  const smartBedtimeResults = await handleSmartBedtimeReminders();

  return NextResponse.json({
    type: 'daily',
    sent,
    failed,
    total: users.length,
    monthly: monthlyResults,
    smartBedtime: smartBedtimeResults,
  });
}

async function handleMonthlyReports(): Promise<{ generated: number; failed: number }> {
  let generated = 0;
  let failed = 0;

  try {
    const users = await getUsersForMonthlyReport();
    console.log(`[Cron] Found ${users.length} users for monthly reports`);

    const supabase = getSupabaseAdmin();

    // Cron now runs hourly for per-user reminder timing — guard against
    // generating the same monthly report 24x per day per user.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const { id: userId, profile } of users) {
      try {
        // Skip if a report was already generated in the past 24h
        const { data: recentReport } = await supabase
          .from('monthly_reports')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', oneDayAgo)
          .limit(1)
          .maybeSingle();

        if (recentReport) continue;

        const periodEnd = new Date();
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - 30);
        const periodStartStr = periodStart.toISOString().split('T')[0];
        const periodEndStr = periodEnd.toISOString().split('T')[0];

        // Fetch sleep logs for the period
        const { data: sleepLogs } = await supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', periodStartStr)
          .lte('date', periodEndStr)
          .order('date', { ascending: false });

        if (!sleepLogs || sleepLogs.length < 20) continue;

        // Fetch checklist logs
        const { data: checklistLogs } = await supabase
          .from('checklist_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', periodStartStr)
          .lte('date', periodEndStr);

        // Fetch tags
        const logIds = sleepLogs.map((l: SleepLog) => l.id);
        const { data: tags } = await supabase
          .from('sleep_log_tags')
          .select('*')
          .in('sleep_log_id', logIds);

        // Get previous report for comparison
        const { data: previousReport } = await supabase
          .from('monthly_reports')
          .select('*')
          .eq('user_id', userId)
          .order('period_start', { ascending: false })
          .limit(1)
          .single();

        const reportId = await createMonthlyReport(
          userId,
          periodStartStr,
          periodEndStr,
          sleepLogs as SleepLog[],
          (checklistLogs || []) as ChecklistLog[],
          profile,
          previousReport as MonthlyReport | null,
          (tags || []) as SleepLogTag[]
        );

        await createMonthlyReportNotification(userId, reportId);
        generated++;
      } catch (error) {
        console.error(`[Cron] Failed to generate monthly report for ${userId}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('[Cron] Monthly report generation failed:', error);
  }

  return { generated, failed };
}

async function handleSmartBedtimeReminders(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const users = await getUsersForSmartReminder();
    console.log(`[Cron] Found ${users.length} users for smart bedtime reminders`);

    for (const userId of users) {
      try {
        await createSmartBedtimeNotification(userId);
        sent++;
      } catch (error) {
        console.error(`[Cron] Failed to send smart bedtime reminder to ${userId}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('[Cron] Smart bedtime reminders failed:', error);
  }

  return { sent, failed };
}

async function handleWeeklySummary(): Promise<NextResponse> {
  const userIds = await getUsersForWeeklySummary();

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const userId of userIds) {
    try {
      const stats = await calculateWeeklyStats(userId);

      if (!stats) {
        skipped++;
        continue;
      }

      await createWeeklySummaryNotification(userId, stats);
      sent++;
    } catch (error) {
      console.error(`Failed to send weekly summary to user ${userId}:`, error);
      failed++;
    }
  }

  console.log(`Weekly summaries: ${sent} sent, ${failed} failed, ${skipped} skipped`);
  return NextResponse.json({
    type: 'weekly',
    sent,
    failed,
    skipped,
    total: userIds.length,
  });
}

// POST endpoint for testing/manual triggers
export async function POST(request: Request) {
  const headersList = await headers();

  if (!verifyRequest(headersList)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { type } = body;

  try {
    if (type === 'daily') {
      return await handleDailyReminders();
    } else if (type === 'weekly') {
      return await handleWeeklySummary();
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
