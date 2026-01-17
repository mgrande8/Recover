import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth callback handler for Supabase.
 * This route exchanges the auth code for a session after OAuth login,
 * email confirmation, or password reset.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Get the 'next' parameter for redirecting after auth
  const next = searchParams.get('next') ?? '/dashboard';

  // Check if this is a password reset flow
  const isPasswordReset = next === '/reset-password';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For password reset, skip onboarding check and go directly to reset page
      if (isPasswordReset) {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Check if user has completed onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      console.error('Auth callback error:', error.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
