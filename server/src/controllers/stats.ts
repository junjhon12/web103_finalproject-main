import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export interface RecentSession {
  id: number;
  user_game_id: number;
  title: string;
  duration: number;
  session_date: string;
  notes: string | null;
}

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  playingGames: number;
  backlogGames: number;
  totalHoursPlayed: number;
  hoursThisWeek: number;
  recentSessions: RecentSession[];
}

const RECENT_SESSION_LIMIT = 5;

// Convert stored minutes to hours, rounding to 1 decimal place
const minutesToHours = (minutes: string): number =>
  Math.round((parseInt(minutes, 10) / 60) * 10) / 10;

export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = Number(req.params.userId);

  // Ownership comes from the verified token; the URL id must match it.
  if (!Number.isInteger(userId) || userId <= 0 || req.user?.id !== userId) {
    res.status(403).json({ error: 'You can only view your own stats' });
    return;
  }

  try {
    // Utilize subqueries to fetch all aggregations in a single database roundtrip
    const aggregateText = `
      SELECT 
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1) as total_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'completed') as completed_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'playing') as playing_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'backlog') as backlog_games,
        (SELECT COALESCE(SUM(ps.duration), 0) FROM play_sessions ps 
         INNER JOIN user_games ug ON ps.user_game_id = ug.id 
         WHERE ug.user_id = $1) as total_minutes,
        (SELECT COALESCE(SUM(ps.duration), 0) FROM play_sessions ps 
         INNER JOIN user_games ug ON ps.user_game_id = ug.id 
         WHERE ug.user_id = $1 AND ps.session_date >= date_trunc('week', CURRENT_DATE)) as week_minutes
    `;

    // Format the DATE server-side so timezones cannot shift the day.
    const recentText = `
      SELECT ps.id, ps.user_game_id, g.title, ps.duration,
             to_char(ps.session_date, 'YYYY-MM-DD') AS session_date, ps.notes
      FROM play_sessions ps
      INNER JOIN user_games ug ON ps.user_game_id = ug.id
      INNER JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = $1
      ORDER BY ps.session_date DESC, ps.id DESC
      LIMIT ${RECENT_SESSION_LIMIT}
    `;

    const [aggregateResult, recentResult] = await Promise.all([
      query(aggregateText, [userId]),
      query(recentText, [userId]),
    ]);
    const row = aggregateResult.rows[0];

    const stats: DashboardStats = {
      totalGames: parseInt(row.total_games, 10),
      completedGames: parseInt(row.completed_games, 10),
      totalHoursPlayed: minutesToHours(row.total_minutes),
      hoursThisWeek: minutesToHours(row.week_minutes),
      recentSessions: recentResult.rows as RecentSession[],
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};
