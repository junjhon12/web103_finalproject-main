import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export interface Goal {
  id: number;
  user_id: number;
  target_hours: number;
  current_streak: number;
}

export interface CreateGoalPayload {
  target_hours: number;
}

export interface UpdateGoalPayload {
  target_hours?: number;
  current_streak?: number;
}

const getIdParam = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// GET: Retrieve the authenticated user's goal
export const getUserGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getIdParam(req.params.userId);

  if (!userId || req.user?.id !== userId) {
    res.status(403).json({ error: 'You can only view your own goal' });
    return;
  }

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

// POST: Create or update the authenticated user's goal
export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  const { target_hours } = req.body as CreateGoalPayload;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (typeof target_hours !== 'number' || !Number.isInteger(target_hours) || target_hours <= 0) {
    res.status(400).json({ error: 'target_hours must be a positive whole number' });
    return;
  }

  try {
    // A user owns a single goal, so an existing row is updated instead of duplicated.
    const text = `
      INSERT INTO goals (user_id, target_hours, current_streak) 
      VALUES ($1, $2, 0) 
      ON CONFLICT (user_id) DO UPDATE SET target_hours = EXCLUDED.target_hours
      RETURNING *
    `;
    const result = await query(text, [userId, target_hours]);

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
export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  const goalId = getIdParam(req.params.id);
  const userId = req.user?.id;
  const { target_hours, current_streak } = req.body as UpdateGoalPayload;

  if (!goalId || !userId) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }

  if (
    target_hours !== undefined &&
    (typeof target_hours !== 'number' || !Number.isInteger(target_hours) || target_hours <= 0)
  ) {
    res.status(400).json({ error: 'target_hours must be a positive whole number' });
    return;
  }

  if (
    current_streak !== undefined &&
    (typeof current_streak !== 'number' || !Number.isInteger(current_streak) || current_streak < 0)
  ) {
    res.status(400).json({ error: 'current_streak must be zero or a positive whole number' });
    return;
  }

  try {
    const text = `
      UPDATE goals 
      SET target_hours = COALESCE($1, target_hours), 
          current_streak = COALESCE($2, current_streak)
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
    const values = [target_hours, current_streak, goalId, userId];
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
