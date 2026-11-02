import React from 'react';
import { Link } from 'react-router-dom';
import type { RecentSession } from '../../api/stats';
import { formatDuration, formatSessionDate } from '../../utils/format';
import { focusRingClass, panelClass } from './styles';

interface RecentSessionsProps {
  sessions: RecentSession[];
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({ sessions }) => {
  return (
    <section aria-labelledby="recent-sessions-heading" className={`${panelClass} lg:col-span-2`}>
      <h2 id="recent-sessions-heading" className="mb-4 text-xl font-semibold">
        Recent Play Sessions
      </h2>

      {sessions.length === 0 ? (
        <div className="p-4 text-sm text-gray-300 bg-gray-700 rounded">
          <p>No play sessions logged yet.</p>
          <p className="mt-1">
            Open a game from your{' '}
            <Link to="/library" className={`text-purple-300 underline rounded ${focusRingClass}`}>
              library
            </Link>{' '}
            to log your first session.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <Link
                  to={`/library/${session.user_game_id}`}
                  className={`font-semibold text-white break-words rounded hover:underline ${focusRingClass}`}
                >
                  {session.title}
                </Link>
                {session.notes && (
                  <p className="text-sm text-gray-400 break-words">{session.notes}</p>
                )}
              </div>
              <p className="text-sm text-gray-300 shrink-0 sm:text-right">
                <span>{formatDuration(session.duration)}</span>
                <span aria-hidden="true"> · </span>
                <span className="sr-only">on </span>
                <time dateTime={session.session_date}>{formatSessionDate(session.session_date)}</time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
