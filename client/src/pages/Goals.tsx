import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserGoal, createGoal, updateGoal, type Goal } from '../api/goals';

export const Goals: React.FC = () => {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [targetHours, setTargetHours] = useState<number | ''>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadGoal = async () => {
      if (!user) return;
      try {
        const existingGoal = await fetchUserGoal(user.id);
        if (existingGoal) {
          setGoal(existingGoal);
          setTargetHours(existingGoal.target_hours);
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadGoal();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || targetHours === '') return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (goal) {
        // Update existing goal
        const updatedGoal = await updateGoal(goal.id, { target_hours: Number(targetHours) });
        setGoal(updatedGoal);
        setSuccessMsg('Goal updated successfully!');
      } else {
        // Create new goal
        const newGoal = await createGoal({ user_id: user.id, target_hours: Number(targetHours) });
        setGoal(newGoal);
        setSuccessMsg('Goal created successfully!');
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-white">Loading goals...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-white">
      <h1 className="text-3xl font-bold">Playtime Goals & Streaks</h1>
      
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">Current Progress</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="p-4 bg-gray-700 rounded border-l-4 border-purple-500">
            <p className="text-sm text-gray-400">Weekly Target</p>
            <p className="text-3xl font-bold">{goal ? `${goal.target_hours} Hours` : 'Not Set'}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded border-l-4 border-green-500">
            <p className="text-sm text-gray-400">Active Streak</p>
            <p className="text-3xl font-bold text-green-400">{goal?.current_streak || 0} Days</p>
          </div>
        </div>
      </section>

      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">{goal ? 'Update Your Goal' : 'Set a New Goal'}</h2>
        {error && <div className="p-3 mb-4 text-sm text-red-200 bg-red-900 rounded">{error}</div>}
        {successMsg && <div className="p-3 mb-4 text-sm text-green-200 bg-green-900 rounded">{successMsg}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Target Playtime (Hours per Week)</label>
            <input 
              type="number" min="1" required
              value={targetHours} 
              onChange={(e) => setTargetHours(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full max-w-xs p-2 mt-1 bg-gray-700 rounded text-white border border-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button 
            type="submit" disabled={isSubmitting || targetHours === ''}
            className="px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Goal'}
          </button>
        </form>
      </section>
    </div>
  );
};