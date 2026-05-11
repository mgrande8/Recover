import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

/**
 * Auth callback handler for Supabase.
 * Exchanges the auth code for a session after OAuth login, email
 * confirmation, or password reset. Also handles token_hash+type as a
 * fallback so password-reset emails from before the /auth/confirm switch
 * keep working.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  const isPasswordReset = next === '/reset-password' || type === 'recovery';
  const supabase = await createClient();

  // PKCE / OAuth flow — same browser session as request
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isPasswordReset) {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      console.error('Auth callback code exchange error:', error.message);
    }
  }

  // Token-hash flow — works cross-browser/cross-device. Supports legacy
  // reset emails that still point here instead of /auth/confirm.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      if (isPasswordReset) {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      console.error('Auth callback OTP verify error:', error.message);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
