import React from 'react';
import type { DashboardStats as DashboardStatsData } from '../../api/stats';
import { panelClass } from './styles';

interface DashboardStatsProps {
  stats: DashboardStatsData;
  currentStreak: number;
}

interface StatCard {
  label: string;
  value: string;
  accentClass: string;
}

const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, currentStreak }) => {
  const cards: StatCard[] = [
    { label: 'Total Games', value: String(stats.totalGames), accentClass: 'text-white' },
    { label: 'Completed Games', value: String(stats.completedGames), accentClass: 'text-blue-400' },
    { label: 'Hours Played', value: `${stats.totalHoursPlayed}h`, accentClass: 'text-yellow-400' },
    {
      label: 'Current Streak',
      value: pluralize(currentStreak, 'Day', 'Days'),
      accentClass: 'text-green-400',
    },
  ];

  return (
    <section aria-labelledby="dashboard-stats-heading" className={panelClass}>
      <h2 id="dashboard-stats-heading" className="mb-4 text-xl font-semibold">
        Stats Overview
      </h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="p-4 bg-gray-700 rounded min-w-0">
            <dt className="text-sm text-gray-300">{card.label}</dt>
            <dd className={`text-2xl font-bold break-words ${card.accentClass}`}>{card.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
