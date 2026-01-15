import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('user_id');

  // Try to get current user if no user_id provided
  let userId = userIdParam;

  if (!userId) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Ignore auth errors
    }
  }

  if (!userId) {
    return NextResponse.json({
      error: 'No user found. Either log in or provide ?user_id=xxx parameter',
      hint: 'Get your user ID from Supabase Auth dashboard',
    }, { status: 400 });
  }

  // Use admin client to bypass RLS
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, is_pro, pro_expires_at, stripe_subscription_id')
    .eq('id', userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Detailed type analysis
  const isPro = profile.is_pro;

  return NextResponse.json({
    user_id: userId,
    profile: profile,
    type_analysis: {
      is_pro_value: isPro,
      is_pro_type: typeof isPro,
      is_pro_strict_equals_true: isPro === true,
      is_pro_strict_equals_false: isPro === false,
      is_pro_double_equals_true: isPro == true,
      is_pro_truthy: !!isPro,
      is_pro_json_stringify: JSON.stringify(isPro),
    },
    pro_expires_at: profile.pro_expires_at,
    pro_expires_at_valid: profile.pro_expires_at ? new Date(profile.pro_expires_at) > new Date() : false,
    stripe_subscription_id: profile.stripe_subscription_id,
    recommendation: isPro === true
      ? 'is_pro is correctly set to boolean true'
      : isPro
        ? `is_pro is truthy but not boolean true (value: ${JSON.stringify(isPro)}, type: ${typeof isPro}). Run: UPDATE profiles SET is_pro = true WHERE id = '${userId}';`
        : `is_pro is falsy. Run: UPDATE profiles SET is_pro = true, pro_expires_at = NOW() + INTERVAL '1 year' WHERE id = '${userId}';`,
  });
}
