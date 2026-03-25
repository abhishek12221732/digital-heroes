import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default function LogoutButton() {
  const logout = async () => {
    'use server';

    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect('/login');
  };

  return (
    <form action={logout} className="inline">
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg bg-white/15 text-white border border-white/30 text-sm hover:bg-white/20 transition"
      >
        Logout
      </button>
    </form>
  );
}
