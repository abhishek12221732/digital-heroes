'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approvePayout(winnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify the user clicking this is actually an Admin [cite: 38]
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized: Admin access required");

  // Update the payout status from 'pending' to 'paid' [cite: 85, 112]
  const { error } = await supabase
    .from('winners')
    .update({ payout_status: 'paid' })
    .eq('id', winnerId);

  if (error) throw new Error("Failed to update payout status");

  // Refresh the admin dashboard so the pending list updates instantly
  revalidatePath('/admin');
  
  return { success: true };
}