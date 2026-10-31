import { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export interface PlaySession {
  id: number;
  user_game_id: number;
  duration: number;
  session_date: string;
  notes: string | null;
}

export interface CreateSessionPayload {
  user_game_id: number;
  duration: number;
  session_date?: string;
  notes?: string;
}

export interface UpdateSessionPayload {
  duration?: number;
  session_date?: string;
  notes?: string | null;
}

const getIdParam = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const isValidDuration = (duration: unknown): duration is number =>
  typeof duration === 'number' && Number.isInteger(duration) && duration > 0;

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

// GET: Retrieve all play sessions for a game in the authenticated user's library
export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userGameId = getIdParam(req.params.userGameId);
  const userId = req.user?.id;

  if (!userGameId || !userId) {
    res.status(404).json({ error: 'Game library record not found' });
    return;
  }

  try {
    // Joining user_games scopes the result to the authenticated user's record.
    const text = `
      SELECT ps.*
      FROM play_sessions ps
      INNER JOIN user_games ug ON ps.user_game_id = ug.id
      WHERE ps.user_game_id = $1 AND ug.user_id = $2
      ORDER BY ps.session_date DESC, ps.id DESC
    `;
    const result = await query(text, [userGameId, userId]);
    res.status(200).json(result.rows as PlaySession[]);
  } catch (error) {
    console.error('Error fetching play sessions:', error);
    res.status(500).json({ error: 'Failed to fetch play sessions' });
  }
};

// POST: Log a new play session
export const logSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_game_id, duration, session_date, notes } = req.body as CreateSessionPayload;
  const userGameId = Number(user_game_id);
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!Number.isInteger(userGameId) || userGameId <= 0 || duration === undefined) {
    res.status(400).json({ error: 'user_game_id and duration are required' });
    return;
  }

  if (!isValidDuration(duration)) {
    res.status(400).json({ error: 'Duration must be a positive whole number of minutes' });
    return;
  }

  if (session_date !== undefined && !isValidDate(session_date)) {
    res.status(400).json({ error: 'session_date must use the YYYY-MM-DD format' });
    return;
  }

  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    res.status(400).json({ error: 'Notes must be text' });
    return;
  }

  try {
    // The INSERT only succeeds when the library record belongs to this user.
    const text = `
      INSERT INTO play_sessions (user_game_id, duration, session_date, notes)
      SELECT $1, $2, COALESCE($3, CURRENT_DATE), $4
      WHERE EXISTS (
        SELECT 1 FROM user_games WHERE id = $1 AND user_id = $5
      )
      RETURNING *
    `;
    const values = [userGameId, duration, session_date || null, notes || null, userId];
    const result = await query(text, values);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Game library record not found' });
      return;
    }

    res.status(201).json(result.rows[0] as PlaySession);
  } catch (error) {
    console.error('Error logging play session:', error);
    res.status(500).json({ error: 'Failed to log play session' });
  }
};

// PATCH: Update an existing play session
export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const sessionId = getIdParam(req.params.id);
  const userId = req.user?.id;
  const { duration, session_date, notes } = req.body as UpdateSessionPayload;

  if (!sessionId || !userId) {
    res.status(404).json({ error: 'Play session not found' });
    return;
  }

  if (duration !== undefined && !isValidDuration(duration)) {
    res.status(400).json({ error: 'Duration must be a positive whole number of minutes' });
    return;
  }

  if (session_date !== undefined && !isValidDate(session_date)) {
    res.status(400).json({ error: 'session_date must use the YYYY-MM-DD format' });
    return;
  }

  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    res.status(400).json({ error: 'Notes must be text' });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (duration !== undefined) {
    values.push(duration);
    fields.push(`duration = $${values.length}`);
  }
  if (session_date !== undefined) {
    values.push(session_date);
    fields.push(`session_date = $${values.length}`);
  }
  if (notes !== undefined) {
    values.push(notes);
    fields.push(`notes = $${values.length}`);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(sessionId, userId);
  const idParam = values.length - 1;
  const userParam = values.length;

  try {
    const text = `
      UPDATE play_sessions 
      SET ${fields.join(', ')}
      WHERE id = $${idParam}
        AND user_game_id IN (SELECT id FROM user_games WHERE user_id = $${userParam})
      RETURNING *
    `;
    const result = await query(text, values);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Play session not found' });
      return;
    }

    res.status(200).json(result.rows[0] as PlaySession);
  } catch (error) {
    console.error('Error updating play session:', error);
    res.status(500).json({ error: 'Failed to update play session' });
  }
};

// DELETE: Remove a play session
export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const sessionId = getIdParam(req.params.id);
  const userId = req.user?.id;

  if (!sessionId || !userId) {
    res.status(404).json({ error: 'Play session not found' });
    return;
  }

  try {
    const result = await query(
      `DELETE FROM play_sessions
       WHERE id = $1
         AND user_game_id IN (SELECT id FROM user_games WHERE user_id = $2)
       RETURNING id`,
      [sessionId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Play session not found' });
      return;
    }

    res.status(200).json({ message: 'Play session deleted', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting play session:', error);
    res.status(500).json({ error: 'Failed to delete play session' });
  }
};
