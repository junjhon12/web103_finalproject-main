import React from 'react';
import { Link } from 'react-router-dom';
import type { Goal } from '../../api/goals';
import { focusRingClass, panelClass } from './styles';

interface GoalProgressProps {
  goal: Goal | null;
  hoursThisWeek: number;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ goal, hoursThisWeek }) => {
  return (
    <section aria-labelledby="goal-progress-heading" className={panelClass}>
      <h2 id="goal-progress-heading" className="mb-4 text-xl font-semibold">
        Weekly Goal
      </h2>

      {goal ? (
        <GoalBar goal={goal} hoursThisWeek={hoursThisWeek} />
      ) : (
        <div className="space-y-3 text-sm text-gray-300">
          <p>You haven&apos;t set a weekly playtime goal yet.</p>
          <Link
            to="/goals"
            className={`inline-block px-4 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700 ${focusRingClass}`}
          >
            Create a goal
          </Link>
        </div>
      )}
    </section>
  );
};

const GoalBar: React.FC<{ goal: Goal; hoursThisWeek: number }> = ({ goal, hoursThisWeek }) => {
  const percent =
    goal.target_hours > 0 ? Math.min(100, Math.round((hoursThisWeek / goal.target_hours) * 100)) : 0;
  const isComplete = hoursThisWeek >= goal.target_hours;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-300">
        <span className="text-2xl font-bold text-white">{hoursThisWeek}</span> of{' '}
        {goal.target_hours} hours this week ({percent}%)
      </p>
      <div
        role="progressbar"
        aria-label="Weekly goal progress"
        aria-valuemin={0}
        aria-valuemax={goal.target_hours}
        aria-valuenow={Math.min(hoursThisWeek, goal.target_hours)}
        aria-valuetext={`${hoursThisWeek} of ${goal.target_hours} hours`}
        className="w-full h-3 overflow-hidden bg-gray-700 rounded-full"
      >
        <div
          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-gray-300">
        {isComplete ? 'Goal reached this week. Nice work!' : 'Week runs Monday to Sunday.'}
      </p>
      <Link
        to="/goals"
        className={`inline-block text-sm text-purple-300 underline rounded ${focusRingClass}`}
      >
        Edit goal
      </Link>
    </div>
  );
};
