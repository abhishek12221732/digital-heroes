import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Must be logged in to subscribe
  if (!user) redirect('/login?message=Please log in to subscribe');

  // Fetch charities for the dropdown
  const { data: charities } = await supabase.from('charities').select('*');

  // Server action to trigger the mock checkout
  const handleCheckout = async (formData: FormData) => {
    'use server';
    const plan = formData.get('plan') as string;
    const charityId = formData.get('charityId') as string;
    const percent = formData.get('percent') as string;
    
    const params = new URLSearchParams({
      userId: user.id,
      charityId,
      percent,
      plan
    });
    
    redirect(`/mock-payment?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-light mb-2">Choose Your Impact</h1>
        <p className="text-gray-500 mb-8">Select a plan and the charity you want to support.</p>

        <form action={handleCheckout} className="space-y-6">
          
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Subscription Plan</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input type="radio" name="plan" value="monthly" className="peer sr-only" required defaultChecked />
                <div className="p-4 rounded-xl border-2 border-gray-100 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 transition-all">
                  <div className="font-semibold text-gray-900">Monthly</div>
                  <div className="text-indigo-600 font-bold mt-1">$20 / mo</div>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="plan" value="yearly" className="peer sr-only" required />
                <div className="p-4 rounded-xl border-2 border-gray-100 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 transition-all">
                  <div className="font-semibold text-gray-900">Yearly</div>
                  <div className="text-indigo-600 font-bold mt-1">$200 / yr</div>
                  <div className="text-xs text-green-600 mt-1 font-medium">Save $40</div>
                </div>
              </label>
            </div>
          </div>

          {/* Charity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Select Charity</label>
            <select name="charityId" required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Choose a cause...</option>
              {charities?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Contribution Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Contribution Percentage</label>
            <p className="text-xs text-gray-500 mb-3">Minimum 10% required by platform.</p>
            <input 
              type="number" 
              name="percent" 
              min="10" 
              max="100" 
              defaultValue="10"
              required 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl transition-colors mt-4">
            Proceed to Checkout
          </button>
        </form>
      </div>
    </div>
  );
}