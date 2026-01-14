import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to home page
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
