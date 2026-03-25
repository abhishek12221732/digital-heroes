'use server'

import { createClient } from '@/utils/supabase/server'; // Adjust this import based on your Supabase setup
import { revalidatePath } from 'next/cache';

export async function submitGolfScore(score: number, playedDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to submit a score." };
  }

  // PRD Requirement: Score range 1-45 [cite: 45]
  if (score < 1 || score > 45) {
    return { error: "Score must be between 1 and 45." };
  }

  // 1. Insert the new score with the required date [cite: 46]
  const { error: insertError } = await supabase
    .from('scores')
    .insert([{ user_id: user.id, score: score, played_date: playedDate }]);

  if (insertError) {
    return { error: "Failed to save score." };
  }

  // 2. Fetch all scores for this user, ordered newest to oldest [cite: 50]
  const { data: scores, error: fetchError } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (fetchError) {
    return { error: "Score saved, but failed to fetch history." };
  }

  // 3. Enforce the rolling 5-score limit [cite: 48]
  if (scores && scores.length > 5) {
    // Grab the IDs of any scores beyond the latest 5
    const scoresToDelete = scores.slice(5).map(s => s.id);

    // Delete the oldest scores [cite: 49]
    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .in('id', scoresToDelete);

    if (deleteError) {
      console.error("Failed to delete old scores:", deleteError);
    }
  }

  // Refresh the dashboard so the new scores show up immediately
  revalidatePath('/dashboard');
  
  return { success: true };
}