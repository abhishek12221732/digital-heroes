import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ScoreEntryForm from '@/components/ScoreEntryForm';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all required user data in parallel for speed
  const [
    { data: profile },
    { data: scores },
    { data: winnings }
  ] = await Promise.all([
    supabase.from('users').select('*, charities(*)').eq('id', user.id).single(),
    supabase.from('scores').select('*').eq('user_id', user.id).order('played_date', { ascending: false }),
    supabase.from('winners').select('*').eq('user_id', user.id)
  ]);

  if (profile?.role === 'admin') {
    redirect('/admin');
  }

  // Calculate total winnings [cite: 96]
  const totalWinnings = winnings?.reduce((sum, win) => sum + Number(win.prize_amount), 0) || 0;
  const activeDraws = scores?.length === 5 ? 1 : 0; // Rough logic: need 5 scores to be fully participating

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section - Leading with Charity Impact [cite: 120] */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-white flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2">Welcome back.</h1>
            <p className="text-indigo-200 text-lg max-w-2xl">
              Your subscription is currently <span className="font-semibold text-white">{profile?.sub_status || 'Inactive'}</span>. 
              You are actively supporting <span className="font-semibold text-white">{profile?.charities?.name || 'a charity'}</span> with {profile?.charity_contribution_percent || 10}% of your fee.
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-6 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Score Entry & History [cite: 90] */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Score Entry Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Log Your Latest Round</h2>
              <ScoreEntryForm />
            </div>

            {/* Score History (The Rolling 5) */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Draw Scores</h2>
              {scores && scores.length > 0 ? (
                <div className="space-y-3">
                  {scores.map((score, index) => (
                    <div key={score.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {score.score}
                        </div>
                        <span className="text-gray-600 text-sm">Played on {new Date(score.played_date).toLocaleDateString()}</span>
                      </div>
                      {index === 0 && <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Newest</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p>No scores logged yet. Enter 5 scores to enter the draw!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stats & Winnings [cite: 92, 96] */}
          <div className="space-y-6">
            
            {/* Winnings Card */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-lg">
              <h2 className="text-lg font-medium text-orange-50 mb-2">Total Lifetime Winnings</h2>
              <div className="text-5xl font-light mb-6">${totalWinnings.toFixed(2)}</div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-orange-100 uppercase tracking-wider">Recent Payouts</h3>
                {winnings && winnings.slice(0,3).map(win => (
                  <div key={win.id} className="flex justify-between items-center text-sm border-t border-orange-400/30 pt-2">
                    <span>{win.match_type}-Number Match</span>
                    <span className="font-medium">${win.prize_amount}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${win.payout_status === 'paid' ? 'bg-white/20' : 'bg-black/20'}`}>
                      {win.payout_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Participation Summary Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Draw Status</h2>
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-gray-600 text-sm">Upcoming Month</span>
                <span className="font-semibold text-gray-900">Active</span>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                You currently have {scores?.length || 0}/5 required scores logged for the next drawing.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}