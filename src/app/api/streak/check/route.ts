import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createStreakNotification } from '@/lib/notifications';
import { sendStreakCelebrationEmail } from '@/lib/email';

// Milestone streaks that trigger celebrations
const MILESTONE_STREAKS = [3, 7, 14, 30];

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's current streak
    const { data: streakData, error: streakError } = await supabaseAdmin
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single();

    if (streakError || !streakData) {
      // No streak record yet - that's fine for new users
      return NextResponse.json({ streak: 0, milestone: false });
    }

    const currentStreak = streakData.current_streak;

    // Check if this streak is a milestone
    if (!MILESTONE_STREAKS.includes(currentStreak)) {
      return NextResponse.json({ streak: currentStreak, milestone: false });
    }

    // Check if we already sent a notification for this milestone
    const { data: existingNotification } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'streak')
      .eq('data->>streak', currentStreak.toString())
      .single();

    if (existingNotification) {
      // Already notified for this milestone
      return NextResponse.json({ streak: currentStreak, milestone: false, already_notified: true });
    }

    // Get user profile for notification preferences
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, email_streak_celebrations')
      .eq('id', user.id)
      .single();

    // Create in-app notification
    try {
      await createStreakNotification(user.id, currentStreak);
      console.log(`Streak notification created for user ${user.id} at ${currentStreak} days`);
    } catch (notificationError) {
      console.error('Failed to create streak notification:', notificationError);
    }

    // Send email if enabled
    if (profile?.email_streak_celebrations !== false && profile?.email) {
      try {
        await sendStreakCelebrationEmail(profile.email, currentStreak);
        console.log(`Streak email sent to ${profile.email} for ${currentStreak} day streak`);
      } catch (emailError) {
        console.error('Failed to send streak email:', emailError);
      }
    }

    return NextResponse.json({
      streak: currentStreak,
      milestone: true,
      message: `Congratulations! You've reached a ${currentStreak}-day streak!`,
    });
  } catch (error) {
    console.error('Streak check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
