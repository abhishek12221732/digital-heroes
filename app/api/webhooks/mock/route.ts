import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the Service Role Key to bypass RLS securely on the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, charityId, percent, status } = body;

    // Update the user's subscription state and charity choices
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        sub_status: status,
        charity_id: charityId,
        charity_contribution_percent: Number(percent)
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}