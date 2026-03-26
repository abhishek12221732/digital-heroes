'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const TIER_SPLITS = { MATCH_5: 0.40, MATCH_4: 0.35, MATCH_3: 0.25 };
const POOL_CONTRIBUTION_PER_USER = 10; 

export async function executeDraw(
  drawMonth: string,
  logicType: 'random' | 'algorithmic',
  isSimulation: boolean = true,
  predefinedNumbers?: number[] // <-- FIX: Added this parameter
) {
  const supabase = await createClient();

  // 1. Calculate Active Subscriber Count & Total Base Pool
  const { count: activeUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('sub_status', 'active');
  const basePrizePool = (activeUsers || 0) * POOL_CONTRIBUTION_PER_USER;

  // 2. Check for Rollover from previous month
  let rolloverAmount = 0;
  const { data: lastDraw } = await supabase.from('draws').select('tier_5_pool, jackpot_rolled_over').order('draw_month', { ascending: false }).limit(1).single();
  if (lastDraw && lastDraw.jackpot_rolled_over) rolloverAmount = Number(lastDraw.tier_5_pool);

  const tier5Pool = (basePrizePool * TIER_SPLITS.MATCH_5) + rolloverAmount;
  const tier4Pool = basePrizePool * TIER_SPLITS.MATCH_4;
  const tier3Pool = basePrizePool * TIER_SPLITS.MATCH_3;

  // 3. Generate Winning Numbers OR Use Predefined [FIX]
  let winningNumbers: number[] = predefinedNumbers || [];

  if (winningNumbers.length === 0) {
    if (logicType === 'random') {
      while (winningNumbers.length < 5) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!winningNumbers.includes(num)) winningNumbers.push(num);
      }
    } else {
      const { data: allScores } = await supabase.from('scores').select('score');
      const frequency: Record<number, number> = {};
      allScores?.forEach(s => { frequency[s.score] = (frequency[s.score] || 0) + 1; });
      winningNumbers = Object.entries(frequency).sort(([, a], [, b]) => b - a).slice(0, 5).map(([score]) => Number(score));
      while (winningNumbers.length < 5) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!winningNumbers.includes(num)) winningNumbers.push(num);
      }
    }
  }

  // 4. Match User Scores against Winning Numbers
  const { data: userScores } = await supabase.from('scores').select('user_id, score');
  const userMatches: Record<string, number> = {};

  userScores?.forEach(({ user_id, score }) => {
    if (winningNumbers.includes(score)) {
      userMatches[user_id] = (userMatches[user_id] || 0) + 1;
    }
  });

  const winnersList = Object.entries(userMatches).filter(([, matches]) => matches >= 3).map(([user_id, matches]) => ({ user_id, matches }));
  const match5Winners = winnersList.filter(w => w.matches === 5);
  const match4Winners = winnersList.filter(w => w.matches === 4);
  const match3Winners = winnersList.filter(w => w.matches === 3);
  const isJackpotRolledOver = match5Winners.length === 0;

  const drawStatus = isSimulation ? 'simulated' : 'published';

  // 5. Save State
  const { data: drawRecord, error: drawErr } = await supabase.from('draws').upsert({
    draw_month: drawMonth,
    winning_numbers: winningNumbers,
    total_prize_pool: basePrizePool + rolloverAmount,
    tier_5_pool: tier5Pool,
    tier_4_pool: tier4Pool,
    tier_3_pool: tier3Pool,
    status: drawStatus,
    jackpot_rolled_over: isJackpotRolledOver,
  }).select().single();

  if (drawErr) throw new Error("Failed to save draw record");

  // 6. Save Winners to Database
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
      const { error: winnerErr } = await supabase.from('winners').insert(winnersToInsert);
      if (winnerErr) console.error("Winner Insert Error:", winnerErr);
    }
  }

  revalidatePath('/admin');

  return {
    winningNumbers,
    totalPool: basePrizePool + rolloverAmount,
    winners: { match5: match5Winners.length, match4: match4Winners.length, match3: match3Winners.length },
    jackpotRolledOver: isJackpotRolledOver
  };
}