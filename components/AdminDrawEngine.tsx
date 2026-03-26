'use client'

import { useState, useTransition } from 'react';
import { executeDraw } from '@/app/actions/draw';

type SimulationResult = {
  winningNumbers: number[];
  totalPool: number;
  winners: { match5: number; match4: number; match3: number };
  jackpotRolledOver: boolean;
};

export default function AdminDrawEngine() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track which logic was used in the simulation
  const [lastLogic, setLastLogic] = useState<'random' | 'algorithmic'>('random');
  
  const [drawMonth, setDrawMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const handleDraw = (logicType: 'random' | 'algorithmic', isSimulation: boolean, predefinedNumbers?: number[]) => {
    setError(null);
    if (isSimulation) setLastLogic(logicType);

    startTransition(async () => {
      try {
        const res = await executeDraw(drawMonth, logicType, isSimulation, predefinedNumbers);
        setResult(res);
        if (!isSimulation) {
          alert("Draw officially published and winners recorded!");
        }
      } catch (err: any) {
        setError(err.message || "Failed to execute draw.");
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Draw Management Engine</h2>
      
      {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Draw Month</label>
        <input 
          type="date" 
          value={drawMonth}
          onChange={(e) => setDrawMonth(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => handleDraw('random', true)}
          disabled={isPending}
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
        >
          {isPending ? 'Running...' : 'Simulate Random Draw'}
        </button>
        <button
          onClick={() => handleDraw('algorithmic', true)}
          disabled={isPending}
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
        >
          {isPending ? 'Running...' : 'Simulate Algorithmic Draw'}
        </button>
      </div>

      {result && (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-indigo-900">Simulation Results</h3>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 bg-white px-3 py-1 rounded-full">
              Preview Mode
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-indigo-50/50">
              <p className="text-sm text-gray-500 mb-1">Winning Numbers</p>
              <div className="flex gap-2">
                {result.winningNumbers.map((num, i) => (
                  <span key={i} className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {num}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-50/50">
              <p className="text-sm text-gray-500 mb-1">Total Prize Pool</p>
              <p className="text-2xl font-light text-indigo-900">${result.totalPool.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-50/50 mb-6">
            <p className="text-sm text-gray-500 mb-2">Projected Winners</p>
            <div className="flex justify-between text-sm">
              <span>5-Match (Jackpot): <strong className="text-indigo-700">{result.winners.match5}</strong></span>
              <span>4-Match: <strong className="text-indigo-700">{result.winners.match4}</strong></span>
              <span>3-Match: <strong className="text-indigo-700">{result.winners.match3}</strong></span>
            </div>
            {result.jackpotRolledOver && (
              <p className="text-xs text-amber-600 mt-2 font-medium">No 5-match winners. Jackpot will roll over.</p>
            )}
          </div>

          <button
            // FIX: We now pass the exact numbers from the simulation to the publisher
            onClick={() => handleDraw(lastLogic, false, result.winningNumbers)} 
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
          >
            Publish Official Results
          </button>
        </div>
      )}
    </div>
  );
}