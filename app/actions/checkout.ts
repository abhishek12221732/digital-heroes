'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(priceId: string, charityId: string, charityPercent: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in");

  const finalCharityPercent = Math.max(10, charityPercent);

  // Redirect to our own mock payment page with the necessary data
  const params = new URLSearchParams({
    userId: user.id,
    charityId,
    percent: finalCharityPercent.toString(),
    plan: priceId
  });

  redirect(`/mock-payment?${params.toString()}`);
}