import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerDeviceToken } from '@/lib/push';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform, deviceName } = body;

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'Token and platform are required' },
        { status: 400 }
      );
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be ios, android, or web' },
        { status: 400 }
      );
    }

    await registerDeviceToken(user.id, token, platform, deviceName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }
}
