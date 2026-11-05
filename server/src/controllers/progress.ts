import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export interface ProgressEntry {
  id: number;
  user_game_id: number;
  title: string;
  entry_type: 'milestone' | 'achievement';
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface CreateProgressPayload {
  user_game_id: number;
  title: string;
  entry_type?: string;
  is_completed?: boolean;
  notes?: string | null;
}

export interface UpdateProgressPayload {
  title?: string;
  entry_type?: string;
  is_completed?: boolean;
  notes?: string | null;
}

const ENTRY_TYPES = new Set(['milestone', 'achievement']);

const getIdParam = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const isValidTitle = (title: unknown): title is string =>
  typeof title === 'string' && title.trim().length > 0 && title.trim().length <= 255;

const isValidType = (type: unknown): type is string => typeof type === 'string' && ENTRY_TYPES.has(type);

// GET: All progress entries for one of the authenticated user's library games
export const getProgressEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  const userGameId = getIdParam(req.params.userGameId);
  const userId = req.user?.id;

  if (!userGameId || !userId) {
    res.status(404).json({ error: 'Game library record not found' });
    return;
  }

  try {
    const result = await query(
      `SELECT pe.*
       FROM progress_entries pe
       INNER JOIN user_games ug ON pe.user_game_id = ug.id
       WHERE pe.user_game_id = $1 AND ug.user_id = $2
       ORDER BY pe.is_completed ASC, pe.created_at DESC, pe.id DESC`,
      [userGameId, userId]
    );
    res.status(200).json(result.rows as ProgressEntry[]);
  } catch (error) {
    console.error('Error fetching progress entries:', error);
    res.status(500).json({ error: 'Failed to fetch progress entries' });
  }
};

// POST: Log a milestone or achievement
export const createProgressEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_game_id, title, entry_type = 'milestone', is_completed = false, notes } =
    req.body as CreateProgressPayload;
  const userGameId = Number(user_game_id);
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!Number.isInteger(userGameId) || userGameId <= 0) {
    res.status(400).json({ error: 'A valid user_game_id is required' });
    return;
  }
  if (!isValidTitle(title)) {
    res.status(400).json({ error: 'Title is required (255 characters max)' });
    return;
  }
  if (!isValidType(entry_type)) {
    res.status(400).json({ error: 'entry_type must be milestone or achievement' });
    return;
  }
  if (typeof is_completed !== 'boolean') {
    res.status(400).json({ error: 'is_completed must be true or false' });
    return;
  }
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    res.status(400).json({ error: 'Notes must be text' });
    return;
  }

  try {
    // The INSERT only succeeds when the library record belongs to this user.
    const result = await query(
      `INSERT INTO progress_entries (user_game_id, title, entry_type, is_completed, notes)
       SELECT $1, $2, $3, $4, $5
       WHERE EXISTS (SELECT 1 FROM user_games WHERE id = $1 AND user_id = $6)
       RETURNING *`,
      [userGameId, title.trim(), entry_type, is_completed, notes || null, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Game library record not found' });
      return;
    }

    res.status(201).json(result.rows[0] as ProgressEntry);
  } catch (error) {
    console.error('Error creating progress entry:', error);
    res.status(500).json({ error: 'Failed to create progress entry' });
  }
};

// PATCH: Edit an entry or toggle its completion
export const updateProgressEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const entryId = getIdParam(req.params.id);
  const userId = req.user?.id;
  const { title, entry_type, is_completed, notes } = req.body as UpdateProgressPayload;

  if (!entryId || !userId) {
    res.status(404).json({ error: 'Progress entry not found' });
    return;
  }
  if (title !== undefined && !isValidTitle(title)) {
    res.status(400).json({ error: 'Title must be 1-255 characters' });
    return;
  }
  if (entry_type !== undefined && !isValidType(entry_type)) {
    res.status(400).json({ error: 'entry_type must be milestone or achievement' });
    return;
  }
  if (is_completed !== undefined && typeof is_completed !== 'boolean') {
    res.status(400).json({ error: 'is_completed must be true or false' });
    return;
  }
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    res.status(400).json({ error: 'Notes must be text' });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (title !== undefined) {
    values.push(title.trim());
    fields.push(`title = $${values.length}`);
  }
  if (entry_type !== undefined) {
    values.push(entry_type);
    fields.push(`entry_type = $${values.length}`);
  }
  if (is_completed !== undefined) {
    values.push(is_completed);
    fields.push(`is_completed = $${values.length}`);
  }
  if (notes !== undefined) {
    values.push(notes);
    fields.push(`notes = $${values.length}`);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(entryId, userId);
  const idParam = values.length - 1;
  const userParam = values.length;

  try {
    const result = await query(
      `UPDATE progress_entries
       SET ${fields.join(', ')}
       WHERE id = $${idParam}
         AND user_game_id IN (SELECT id FROM user_games WHERE user_id = $${userParam})
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Progress entry not found' });
      return;
    }

    res.status(200).json(result.rows[0] as ProgressEntry);
  } catch (error) {
    console.error('Error updating progress entry:', error);
    res.status(500).json({ error: 'Failed to update progress entry' });
  }
};

// DELETE: Remove an entry
export const deleteProgressEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const entryId = getIdParam(req.params.id);
  const userId = req.user?.id;

  if (!entryId || !userId) {
    res.status(404).json({ error: 'Progress entry not found' });
    return;
  }

  try {
    const result = await query(
      `DELETE FROM progress_entries
       WHERE id = $1
         AND user_game_id IN (SELECT id FROM user_games WHERE user_id = $2)
       RETURNING id`,
      [entryId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Progress entry not found' });
      return;
    }

    res.status(200).json({ message: 'Progress entry deleted', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting progress entry:', error);
    res.status(500).json({ error: 'Failed to delete progress entry' });
  }
};
