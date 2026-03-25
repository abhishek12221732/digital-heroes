import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  // Await the searchParams Promise (Next.js 15 requirement)
  const searchParams = await props.searchParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, route by role
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role === 'admin') {
      redirect('/admin');
    }
    redirect('/dashboard');
  }

  const signIn = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return redirect('/login?message=Could not authenticate user');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') {
        return redirect('/admin');
      }
    }

    return redirect('/dashboard');
  };

  const signUp = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const supabase = await createClient(); 
    const { error } = await supabase.auth.signUp({ email, password });
    
    // ADD THIS LINE TO CATCH THE EXACT ERROR
    if (error) {
      console.log("SUPABASE SIGNUP ERROR:", error);
      return redirect(`/login?message=${error.message}`);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Catch any errors when inserting into your public users table
      const { error: insertError } = await supabase.from('users').insert([{ id: user.id }]);
      if (insertError) {
         console.log("SUPABASE INSERT ERROR:", insertError);
      }
    }
    return redirect('/subscribe');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-semibold text-center mb-6">Welcome Back</h1>
        
        {searchParams?.message && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg text-center">
            {searchParams.message}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button formAction={signIn} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors">
              Log In
            </button>
            <button formAction={signUp} className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-medium py-2.5 rounded-xl transition-colors">
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}