'use client'

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';

// 1. We move the actual logic into a separate internal component
function PaymentSimulator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSimulatePayment = async () => {
    setLoading(true);
    
    const response = await fetch('/api/webhooks/mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: searchParams.get('userId'),
        charityId: searchParams.get('charityId'),
        percent: searchParams.get('percent'),
        status: 'active'
      })
    });

    if (response.ok) {
      router.push('/dashboard?payment=success');
    } else {
      alert("Payment simulation failed");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold">Simulated Checkout</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Due to regional Stripe restrictions, this page simulates a successful PCI-compliant gateway transaction.
        </p>
      </div>

      <button
        onClick={handleSimulatePayment}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors"
      >
        {loading ? 'Processing...' : 'Simulate Successful Payment'}
      </button>
    </div>
  );
}

// 2. We wrap that component in a React Suspense boundary
export default function MockPaymentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="p-8 text-gray-500">Loading secure checkout...</div>}>
        <PaymentSimulator />
      </Suspense>
    </div>
  );
}