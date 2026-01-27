import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * DELETE /api/account/delete
 *
 * Permanently deletes a user's account and all associated data.
 * This is required by Apple App Store guidelines.
 *
 * What gets deleted:
 * - All sleep logs
 * - All checklist logs
 * - User streaks
 * - Notifications
 * - Device tokens (push notifications)
 * - Profile data
 * - Auth account
 *
 * Also cancels any active subscriptions (Stripe/Apple)
 */
export async function DELETE(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get confirmation from request body
    const body = await request.json();
    const { confirmEmail } = body;

    // Verify email matches for confirmation
    if (confirmEmail?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email confirmation does not match' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user profile to check for subscriptions
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, apple_original_transaction_id, subscription_source')
      .eq('id', user.id)
      .single();

    // Cancel Stripe subscription if exists
    if (profile?.stripe_subscription_id) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
        console.log(`Cancelled Stripe subscription ${profile.stripe_subscription_id} for user ${user.id}`);
      } catch (stripeError) {
        // Log but don't fail - subscription might already be cancelled
        console.error('Failed to cancel Stripe subscription:', stripeError);
      }
    }

    // Note: Apple subscriptions cannot be cancelled programmatically
    // They must be cancelled by the user in their Apple ID settings
    // The webhook will handle the status update when Apple notifies us
    if (profile?.apple_original_transaction_id) {
      console.log(`User ${user.id} had Apple subscription - will be handled by Apple webhook`);
    }

    // Delete all user data
    // Note: Most tables have ON DELETE CASCADE, but we'll be explicit for safety

    // Delete device tokens (push notifications)
    const { error: deviceTokensError } = await supabaseAdmin
      .from('device_tokens')
      .delete()
      .eq('user_id', user.id);

    if (deviceTokensError) {
      console.error('Error deleting device tokens:', deviceTokensError);
    }

    // Delete notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // Delete user streaks
    const { error: streaksError } = await supabaseAdmin
      .from('user_streaks')
      .delete()
      .eq('user_id', user.id);

    if (streaksError) {
      console.error('Error deleting user streaks:', streaksError);
    }

    // Delete checklist logs
    const { error: checklistError } = await supabaseAdmin
      .from('checklist_logs')
      .delete()
      .eq('user_id', user.id);

    if (checklistError) {
      console.error('Error deleting checklist logs:', checklistError);
    }

    // Delete sleep logs
    const { error: sleepLogsError } = await supabaseAdmin
      .from('sleep_logs')
      .delete()
      .eq('user_id', user.id);

    if (sleepLogsError) {
      console.error('Error deleting sleep logs:', sleepLogsError);
    }

    // Delete profile (this should cascade delete related records anyway)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete profile data' },
        { status: 500 }
      );
    }

    // Delete the auth user account
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted account for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Account and all data permanently deleted',
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
