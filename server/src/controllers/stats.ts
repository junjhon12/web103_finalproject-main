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
  recentSessions: RecentSession[];
}

export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId <= 0 || req.user?.id !== userId) {
    res.status(403).json({ error: 'You can only view your own stats' });
    return;
  }

  try {
    // Utilize subqueries to fetch all aggregations in a single database roundtrip
    const text = `
      SELECT 
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1) as total_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'completed') as completed_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'playing') as playing_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'backlog') as backlog_games,
        (SELECT COALESCE(SUM(ps.duration), 0) FROM play_sessions ps 
         INNER JOIN user_games ug ON ps.user_game_id = ug.id 
         WHERE ug.user_id = $1) as total_minutes
    `;

    const recentText = `
      SELECT ps.id, ps.user_game_id, g.title, ps.duration, ps.session_date, ps.notes
      FROM play_sessions ps
      INNER JOIN user_games ug ON ps.user_game_id = ug.id
      INNER JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = $1
      ORDER BY ps.session_date DESC, ps.id DESC
      LIMIT 5
    `;

    const [result, recent] = await Promise.all([query(text, [userId]), query(recentText, [userId])]);
    const row = result.rows[0];

    const stats: DashboardStats = {
      totalGames: parseInt(row.total_games, 10),
      completedGames: parseInt(row.completed_games, 10),
      playingGames: parseInt(row.playing_games, 10),
      backlogGames: parseInt(row.backlog_games, 10),
      // Convert stored minutes to hours, rounding to 1 decimal place
      totalHoursPlayed: Math.round((parseInt(row.total_minutes, 10) / 60) * 10) / 10,
      recentSessions: recent.rows as RecentSession[],
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};
