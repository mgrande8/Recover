import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mark user as having rated the app
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ has_rated_app: true })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update rated status:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking user as rated:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
