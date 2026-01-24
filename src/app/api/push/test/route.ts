import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/push';

// Test endpoint to send a push notification to the current user
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sendPushNotification(user.id, {
      title: 'Test Notification',
      body: 'Push notifications are working! Great job setting everything up.',
      data: { type: 'test' },
    });

    return NextResponse.json({
      message: 'Test notification sent',
      ...result,
    });
  } catch (error) {
    console.error('Test push error:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
