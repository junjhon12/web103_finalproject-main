import React from 'react';
import { Link } from 'react-router-dom';
import { focusRingClass, panelClass } from './styles';

export const QuickActions: React.FC = () => {
  return (
    <section aria-labelledby="quick-actions-heading" className={panelClass}>
      <h2 id="quick-actions-heading" className="mb-4 text-xl font-semibold">
        Quick Actions
      </h2>
      <div className="space-y-4">
        <Link
          to="/library"
          className={`block w-full px-4 py-3 font-bold text-center text-white bg-blue-600 rounded hover:bg-blue-700 ${focusRingClass}`}
        >
          Manage Library
        </Link>
        <Link
          to="/goals"
          className={`block w-full px-4 py-3 font-bold text-center text-white bg-gray-700 rounded hover:bg-gray-600 ${focusRingClass}`}
        >
          Set Playtime Goals
        </Link>
        <p className="text-sm text-gray-300">
          Go to your library to log new play sessions, update completion statuses, and write
          reviews.
        </p>
      </div>
    </section>
  );
};
