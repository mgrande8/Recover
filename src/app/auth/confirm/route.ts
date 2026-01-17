import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

/**
 * Email confirmation handler for Supabase.
 * This route handles both:
 * - Token-based flow (token_hash + type parameters)
 * - PKCE flow (code parameter)
 * Handles: signup confirmation, password recovery, magic links
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  // Check if this is a password recovery flow
  const isPasswordRecovery = type === 'recovery';

  // Handle PKCE flow (code parameter)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For password recovery, go directly to reset page
      if (isPasswordRecovery || next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Check onboarding status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Code exchange error:', error.message);
    }
  }

  // Handle token-based flow (token_hash + type parameters)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // For password recovery, skip onboarding check and go directly to reset page
      if (isPasswordRecovery) {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Get the user after verification
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists and onboarding is completed
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        // If no profile or onboarding not completed, redirect to onboarding
        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // Redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('OTP verification error:', error.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not verify email. Please try again.`);
}
