'use client'

import { useState, useTransition } from 'react';
import { submitGolfScore } from '@/app/actions/scores';

export default function ScoreEntryForm() {
  const [score, setScore] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const scoreNum = parseInt(score);
    if (scoreNum < 1 || scoreNum > 45) {
      setError("Score must be between 1 and 45.");
      return;
    }

    startTransition(async () => {
      const result = await submitGolfScore(scoreNum, date);
      if (result.error) {
        setError(result.error);
      } else {
        setScore(''); // Reset on success
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Score (1-45)</label>
          <input
            type="number"
            min="1"
            max="45"
            required
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="e.g. 36"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Played</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving Score...' : 'Submit Score'}
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        Only your latest 5 scores are kept active for the monthly draw.
      </p>
    </form>
  );
}