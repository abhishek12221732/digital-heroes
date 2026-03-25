import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import AdminDrawEngine from '@/components/AdminDrawEngine';
import LogoutButton from '@/components/LogoutButton';
import { approvePayout } from '@/app/actions/verification';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verify Admin Role [cite: 34]
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  // Initialize the Master Key client to bypass RLS for dashboard stats
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch Analytics using supabaseAdmin (Master Key) instead of the standard client
  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: recentDraws },
    { data: pendingVerifications }
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('sub_status', 'active'),
    supabaseAdmin.from('draws').select('*').order('created_at', { ascending: false }).limit(3),
    supabaseAdmin.from('winners').select('id, user_id, match_type, prize_amount').eq('payout_status', 'pending')
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Admin Header */}
      <div className="bg-gray-900 pt-16 pb-24 px-6 text-white">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-red-500/30">
                Admin Access
              </span>
            </div>
            <h1 className="text-3xl font-light">Platform Control Center</h1>
          </div>
          <LogoutButton />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16">
        
        {/* Top Analytics Cards  */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Registered Users</p>
            <p className="text-3xl font-light text-gray-900">{totalUsers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Active Subscribers</p>
            <p className="text-3xl font-light text-indigo-600">{activeSubscribers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Pending Payouts</p>
            <p className="text-3xl font-light text-amber-500">{pendingVerifications?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Last Draw Pool</p>
            <p className="text-3xl font-light text-emerald-600">
              ${recentDraws?.[0]?.total_prize_pool || '0.00'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: The Draw Engine */}
          <div className="lg:col-span-2">
            <AdminDrawEngine />
            
            {/* Quick Winners Verification List [cite: 109-112] */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Winner Verifications</h2>
              {pendingVerifications && pendingVerifications.length > 0 ? (
                <div className="space-y-3">
                  {pendingVerifications.map(winner => (
                    <div key={winner.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">User ID: {winner.user_id.substring(0,8)}...</p>
                        <p className="text-sm text-gray-500">{winner.match_type}-Number Match</p>
                      </div>
                      {/* REPLACED THIS SECTION */}
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-emerald-600">${winner.prize_amount}</span>
                        <form action={async () => {
                          'use server';
                          await approvePayout(winner.id);
                        }}>
                          <button type="submit" className="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                            Mark as Paid
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No pending verifications.</p>
              )}
            </div>
          </div>

          {/* Right Column: Recent Activity */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Draws</h2>
              <div className="space-y-4">
                {recentDraws?.map(draw => (
                  <div key={draw.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">{draw.draw_month}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${draw.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                        {draw.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">Pool: ${draw.total_prize_pool}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}