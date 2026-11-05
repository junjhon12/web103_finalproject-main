import { query } from '../db';

export interface PlaytimeSummary {
  currentStreak: number;
  longestStreak: number;
  weeklyHours: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const toDayNumber = (isoDate: string): number => Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);

// Pure helper: dates are distinct YYYY-MM-DD strings sorted newest first.
export const calculateStreaks = (dates: string[], today: string) => {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const days = dates.map(toDayNumber);
  const todayNumber = toDayNumber(today);

  // The streak is still alive if the player played today or yesterday.
  let currentStreak = 0;
  if (todayNumber - days[0] <= 1) {
    currentStreak = 1;
    for (let i = 1; i < days.length && days[i - 1] - days[i] === 1; i++) currentStreak++;
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i - 1] - days[i] === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  return { currentStreak, longestStreak };
};

export const getPlaytimeSummary = async (userId: number): Promise<PlaytimeSummary> => {
  const [datesResult, weekResult] = await Promise.all([
    query(
      `SELECT CURRENT_DATE::text AS today,
              COALESCE(array_agg(d ORDER BY d DESC), '{}') AS dates
       FROM (
         SELECT DISTINCT ps.session_date::text AS d
         FROM play_sessions ps
         INNER JOIN user_games ug ON ps.user_game_id = ug.id
         WHERE ug.user_id = $1 AND ps.session_date <= CURRENT_DATE
       ) s`,
      [userId]
    ),
    query(
      `SELECT COALESCE(SUM(ps.duration), 0) AS minutes
       FROM play_sessions ps
       INNER JOIN user_games ug ON ps.user_game_id = ug.id
       WHERE ug.user_id = $1
         AND ps.session_date >= date_trunc('week', CURRENT_DATE)::date
         AND ps.session_date <= CURRENT_DATE`,
      [userId]
    ),
  ]);

  const { today, dates } = datesResult.rows[0];
  const { currentStreak, longestStreak } = calculateStreaks(dates as string[], today as string);
  const weeklyHours = Math.round((Number(weekResult.rows[0].minutes) / 60) * 10) / 10;

  return { currentStreak, longestStreak, weeklyHours };
};
