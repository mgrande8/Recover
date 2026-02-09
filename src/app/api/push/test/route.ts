import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushNotification, getLastApnsDebug } from '@/lib/push';

// Test endpoint to send a push notification to the current user
// GET method for easy browser testing
export async function GET(request: Request) {
  return sendTestNotification(request);
}

export async function POST(request: Request) {
  return sendTestNotification(request);
}

async function sendTestNotification(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - please open this in the Recover app or while logged in' }, { status: 401 });
    }

    // Check for delay parameter (gives user time to close app)
    const url = new URL(request.url);
    const delay = parseInt(url.searchParams.get('delay') || '0', 10);

    if (delay > 0 && delay <= 30) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    const result = await sendPushNotification(user.id, {
      title: 'Test Notification',
      body: 'Push notifications are working! Great job setting everything up.',
      data: { type: 'test' },
    });

    // Get debug info from the last APNs call
    const debug = getLastApnsDebug();

    return NextResponse.json({
      message: 'Test notification sent',
      ...result,
      debug,
    });
  } catch (error) {
    console.error('Test push error:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
