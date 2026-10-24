import { Request, Response } from 'express';
import { query } from '../db';

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  totalHoursPlayed: number;
}

export const getUserStats = async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    // Utilize subqueries to fetch all aggregations in a single database roundtrip
    const text = `
      SELECT 
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1) as total_games,
        (SELECT COUNT(*) FROM user_games WHERE user_id = $1 AND status = 'completed') as completed_games,
        (SELECT COALESCE(SUM(ps.duration), 0) FROM play_sessions ps 
         INNER JOIN user_games ug ON ps.user_game_id = ug.id 
         WHERE ug.user_id = $1) as total_minutes
    `;
    
    const result = await query(text, [userId]);
    const row = result.rows[0];

    const stats: DashboardStats = {
      totalGames: parseInt(row.total_games, 10),
      completedGames: parseInt(row.completed_games, 10),
      // Convert stored minutes to hours, rounding to 1 decimal place
      totalHoursPlayed: Math.round((parseInt(row.total_minutes, 10) / 60) * 10) / 10,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};