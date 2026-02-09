import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  getUsersForDailyReminder,
  getUsersForWeeklySummary,
  calculateWeeklyStats,
  createReminderNotification,
  createWeeklySummaryNotification,
} from '@/lib/notifications';

// Verify the request is from a trusted source (Vercel Cron or similar)
function verifyRequest(headersList: Headers): boolean {
  // Vercel Cron jobs include this header automatically
  const vercelCronHeader = headersList.get('x-vercel-cron');
  if (vercelCronHeader) {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;

  // In production, require CRON_SECRET
  if (process.env.NODE_ENV === 'production' && !cronSecret) {
    console.error('CRON_SECRET not set in production - rejecting request');
    return false;
  }

  // In development without secret, allow requests
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing requests (dev only)');
    return true;
  }

  const authHeader = headersList.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
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
  return NextResponse.json({
    type: 'daily',
    sent,
    failed,
    total: users.length,
  });
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
