import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if name column exists by trying to select it
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .limit(1);

    if (testError && testError.message.includes('column "name" does not exist')) {
      // Column doesn't exist, we need to add it
      // Note: Supabase JS client can't run raw SQL, so we'll return instructions
      return NextResponse.json({
        status: 'missing_column',
        message: 'The "name" column does not exist in the profiles table.',
        instructions: 'Please run the following SQL in your Supabase SQL Editor:',
        sql: `
-- Add name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create an index on name for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);
        `.trim(),
      });
    }

    if (testError) {
      return NextResponse.json({
        status: 'error',
        message: testError.message,
        hint: testError.hint,
      }, { status: 500 });
    }

    // Column exists, test an update
    return NextResponse.json({
      status: 'ok',
      message: 'The "name" column exists in the profiles table.',
      testData,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST() {
  // This endpoint attempts to add the column using RPC if available
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try to add the column using a raw SQL approach via RPC
    // First, check if we have an RPC function for this
    const { error: rpcError } = await supabaseAdmin.rpc('add_name_column_if_missing');

    if (rpcError) {
      // RPC doesn't exist or failed, return manual instructions
      return NextResponse.json({
        status: 'manual_required',
        message: 'Automatic migration not available. Please run SQL manually.',
        sql: `
-- Add name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create an index on name for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);
        `.trim(),
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Column added successfully',
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
