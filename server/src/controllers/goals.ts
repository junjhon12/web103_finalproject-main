import { Request, Response } from 'express';
import { query } from '../db';

export interface Goal {
  id: number;
  user_id: number;
  target_hours: number;
  current_streak: number;
}

export interface CreateGoalPayload {
  user_id: number;
  target_hours: number;
}

export interface UpdateGoalPayload {
  target_hours?: number;
  current_streak?: number;
}

// GET: Retrieve a user's goal
export const getUserGoal = async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const text = 'SELECT * FROM goals WHERE user_id = $1 LIMIT 1';
    const result = await query(text, [userId]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'No goals found for this user' });
      return;
    }

    res.status(200).json(result.rows[0] as Goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

// POST: Create a new goal for a user
export const createGoal = async (req: Request<{}, {}, CreateGoalPayload>, res: Response): Promise<void> => {
  const { user_id, target_hours } = req.body;

  if (!user_id || target_hours === undefined) {
    res.status(400).json({ error: 'user_id and target_hours are required' });
    return;
  }

  try {
    // Upsert logic: if a goal exists, we might want to prevent duplicate rows per user, 
    // but based on standard schema, we'll just insert.
    const text = `
      INSERT INTO goals (user_id, target_hours, current_streak) 
      VALUES ($1, $2, 0) 
      RETURNING *
    `;
    const result = await query(text, [user_id, target_hours]);
    
    res.status(201).json(result.rows[0] as Goal);
  } catch (error: any) {
    console.error('Error creating goal:', error);
    if (error.code === '23503') {
      res.status(404).json({ error: 'Associated user not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// PATCH: Update goal targets or streak
export const updateGoal = async (req: Request<{ id: string }, {}, UpdateGoalPayload>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { target_hours, current_streak } = req.body;

  try {
    const text = `
      UPDATE goals 
      SET target_hours = COALESCE($1, target_hours), 
          current_streak = COALESCE($2, current_streak)
      WHERE id = $3 
      RETURNING *
    `;
    const values = [target_hours, current_streak, id];
    const result = await query(text, values);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.status(200).json(result.rows[0] as Goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};