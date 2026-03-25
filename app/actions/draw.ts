'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// PRD Constants [cite: 70]
const TIER_SPLITS = {
  MATCH_5: 0.40,
  MATCH_4: 0.35,
  MATCH_3: 0.25,
};

// Assuming a fixed $10 goes to the prize pool per active subscriber for this logic
const POOL_CONTRIBUTION_PER_USER = 10; 

export async function executeDraw(
  drawMonth: string, // Format: YYYY-MM-01
  logicType: 'random' | 'algorithmic',
  isSimulation: boolean = true
) {
  const supabase = await createClient();

  // 1. Calculate Active Subscriber Count & Total Base Pool
  const { count: activeUsers, error: userErr } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('sub_status', 'active');

  if (userErr) throw new Error("Failed to fetch active users.");
  
  const basePrizePool = (activeUsers || 0) * POOL_CONTRIBUTION_PER_USER;

  // 2. Check for Rollover from previous month [cite: 63, 73]
  let rolloverAmount = 0;
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('tier_5_pool, jackpot_rolled_over')
    .order('draw_month', { ascending: false })
    .limit(1)
    .single();

  if (lastDraw && lastDraw.jackpot_rolled_over) {
    rolloverAmount = Number(lastDraw.tier_5_pool);
  }

  // 3. Calculate Tier Pools [cite: 70-71]
  const tier5Pool = (basePrizePool * TIER_SPLITS.MATCH_5) + rolloverAmount;
  const tier4Pool = basePrizePool * TIER_SPLITS.MATCH_4;
  const tier3Pool = basePrizePool * TIER_SPLITS.MATCH_3;

  // 4. Generate Winning Numbers (1-45) [cite: 45, 57-59]
  let winningNumbers: number[] = [];

  if (logicType === 'random') {
    // Generate 5 unique random numbers
    while (winningNumbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!winningNumbers.includes(num)) winningNumbers.push(num);
    }
  } else {
    // Algorithmic: Weighted by most frequent user scores
    const { data: allScores } = await supabase.from('scores').select('score');
    const frequency: Record<number, number> = {};
    
    allScores?.forEach(s => {
      frequency[s.score] = (frequency[s.score] || 0) + 1;
    });

    // Sort by most frequent and pick top 5
    winningNumbers = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([score]) => Number(score));
      
    // Fallback to random if not enough score data exists yet
    while (winningNumbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!winningNumbers.includes(num)) winningNumbers.push(num);
    }
  }

  // 5. Match User Scores against Winning Numbers [cite: 52-55]
  const { data: userScores } = await supabase.from('scores').select('user_id, score');
  const userMatches: Record<string, number> = {};

  // Group scores by user and count matches
  userScores?.forEach(({ user_id, score }) => {
    if (winningNumbers.includes(score)) {
      userMatches[user_id] = (userMatches[user_id] || 0) + 1;
    }
  });

  // Filter out winners (3, 4, or 5 matches)
  const winnersList = Object.entries(userMatches)
    .filter(([, matches]) => matches >= 3)
    .map(([user_id, matches]) => ({ user_id, matches }));

  const match5Winners = winnersList.filter(w => w.matches === 5);
  const match4Winners = winnersList.filter(w => w.matches === 4);
  const match3Winners = winnersList.filter(w => w.matches === 3);

  const isJackpotRolledOver = match5Winners.length === 0;

  // 6. Save State [cite: 62-63]
  const drawStatus = isSimulation ? 'simulated' : 'published';

  // Upsert the draw record
  const { data: drawRecord, error: drawErr } = await supabase
    .from('draws')
    .upsert({
      draw_month: drawMonth,
      winning_numbers: winningNumbers,
      total_prize_pool: basePrizePool + rolloverAmount,
      tier_5_pool: tier5Pool,
      tier_4_pool: tier4Pool,
      tier_3_pool: tier3Pool,
      status: drawStatus,
      jackpot_rolled_over: isJackpotRolledOver,
    })
    .select()
    .single();

  if (drawErr) throw new Error("Failed to save draw record");

  // If this is an official publish, save the winners and their payouts [cite: 72]
  if (!isSimulation && drawRecord) {
    const winnersToInsert = winnersList.map((winner) => {
      let prizeAmount = 0;
      if (winner.matches === 5) prizeAmount = tier5Pool / match5Winners.length;
      if (winner.matches === 4) prizeAmount = tier4Pool / match4Winners.length;
      if (winner.matches === 3) prizeAmount = tier3Pool / match3Winners.length;

      return {
        draw_id: drawRecord.id,
        user_id: winner.user_id,
        match_type: winner.matches,
        prize_amount: Number(prizeAmount.toFixed(2)),
        payout_status: 'pending',
      };
    });

    if (winnersToInsert.length > 0) {
      await supabase.from('winners').insert(winnersToInsert);
    }
  }

  revalidatePath('/admin');

  // Return the results so the Admin UI can display the simulation
  return {
    winningNumbers,
    totalPool: basePrizePool + rolloverAmount,
    winners: {
      match5: match5Winners.length,
      match4: match4Winners.length,
      match3: match3Winners.length,
    },
    jackpotRolledOver: isJackpotRolledOver
  };
}