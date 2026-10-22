import { Request, Response } from 'express';
import { query } from '../db';

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
  notes?: string;
}

// GET: Retrieve all play sessions for a specific user's game
export const getSessions = async (req: Request<{ userGameId: string }>, res: Response): Promise<void> => {
  const { userGameId } = req.params;

  try {
    const text = 'SELECT * FROM play_sessions WHERE user_game_id = $1 ORDER BY session_date DESC, id DESC';
    const result = await query(text, [userGameId]);
    res.status(200).json(result.rows as PlaySession[]);
  } catch (error) {
    console.error('Error fetching play sessions:', error);
    res.status(500).json({ error: 'Failed to fetch play sessions' });
  }
};

// POST: Log a new play session
export const logSession = async (req: Request<{}, {}, CreateSessionPayload>, res: Response): Promise<void> => {
  const { user_game_id, duration, session_date, notes } = req.body;

  if (!user_game_id || duration === undefined) {
    res.status(400).json({ error: 'user_game_id and duration are required' });
    return;
  }

  try {
    const text = `
      INSERT INTO play_sessions (user_game_id, duration, session_date, notes) 
      VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4) 
      RETURNING *
    `;
    const values = [user_game_id, duration, session_date || null, notes || null];
    const result = await query(text, values);
    
    res.status(201).json(result.rows[0] as PlaySession);
  } catch (error: any) {
    console.error('Error logging play session:', error);
    // Catch foreign key violation if user_game_id doesn't exist
    if (error.code === '23503') {
      res.status(404).json({ error: 'Associated game library record not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to log play session' });
  }
};

// PATCH: Update an existing play session
export const updateSession = async (req: Request<{ id: string }, {}, UpdateSessionPayload>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { duration, session_date, notes } = req.body;

  try {
    const text = `
      UPDATE play_sessions 
      SET duration = COALESCE($1, duration), 
          session_date = COALESCE($2, session_date), 
          notes = COALESCE($3, notes)
      WHERE id = $4 
      RETURNING *
    `;
    const values = [duration, session_date, notes, id];
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
export const deleteSession = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM play_sessions WHERE id = $1 RETURNING id', [id]);

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