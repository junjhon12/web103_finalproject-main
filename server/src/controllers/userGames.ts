import { Request, Response } from 'express';
import { query } from '../db';
import { Game } from './games';
import { AuthRequest } from '../middleware/auth';

// Extends the base Game interface with user-specific relationship data
export interface PopulatedUserGame extends Game {
  user_game_id: number;
  user_id: number;
  status: string;
  rating: number | null;
  review: string | null;
}

export interface AddGamePayload {
  game_id: number;
  status?: string;
}

export interface UpdateLibraryPayload {
  status?: string | null;
  rating?: number | null;
  review?: string | null;
}

const VALID_STATUSES = new Set(['backlog', 'playing', 'completed']);

const validateStatus = (status: unknown): status is string =>
  typeof status === 'string' && VALID_STATUSES.has(status);

const validateRating = (rating: unknown): boolean =>
  rating === null ||
  (typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5);

const getIdParam = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// GET: Retrieve the authenticated user's populated game library using an INNER JOIN
export const getUserLibrary = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getIdParam(req.params.userId);

  if (!userId || req.user?.id !== userId) {
    res.status(403).json({ error: 'You can only view your own library' });
    return;
  }

  try {
    const text = `
      SELECT 
        ug.id AS user_game_id, 
        ug.user_id, 
        ug.status, 
        ug.rating, 
        ug.review,
        g.id AS id,
        g.title, 
        g.platform, 
        g.genre, 
        g.cover_image_url
      FROM user_games ug
      INNER JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = $1
      ORDER BY ug.id DESC
    `;
    const result = await query(text, [userId]);
    res.status(200).json(result.rows as PopulatedUserGame[]);
  } catch (error) {
    console.error('Error fetching user library:', error);
    res.status(500).json({ error: 'Failed to fetch user library' });
  }
};

// POST: Add a game to the authenticated user's library
export const addGameToLibrary = async (req: AuthRequest, res: Response): Promise<void> => {
  const gameId = Number(req.body.game_id);
  const status = req.body.status === undefined ? 'backlog' : req.body.status;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!Number.isInteger(gameId) || gameId <= 0) {
    res.status(400).json({ error: 'A valid game_id is required' });
    return;
  }

  if (!validateStatus(status)) {
    res.status(400).json({ error: 'Status must be backlog, playing, or completed' });
    return;
  }

  try {
    // The user id always comes from the verified token, never the request body.
    const text = `
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const result = await query(text, [userId, gameId, status]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding game to library:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'That game is already in your library' });
      return;
    }
    if (error.code === '23503') {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to add game to library' });
  }
};

// PATCH: Update a game's status, rating, or review in the library
export const updateLibraryGame = async (req: AuthRequest, res: Response): Promise<void> => {
  const userGameId = getIdParam(req.params.id); // user_games.id, not games.id
  const userId = req.user?.id;
  const { status, rating, review } = req.body as UpdateLibraryPayload;

  if (!userGameId || !userId) {
    res.status(404).json({ error: 'Library record not found' });
    return;
  }

  if (status !== undefined && !validateStatus(status)) {
    res.status(400).json({ error: 'Status must be backlog, playing, or completed' });
    return;
  }

  if (rating !== undefined && !validateRating(rating)) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5, or null' });
    return;
  }

  if (review !== undefined && review !== null && typeof review !== 'string') {
    res.status(400).json({ error: 'Review must be text or null' });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (status !== undefined) {
    values.push(status);
    fields.push(`status = $${values.length}`);
  }
  if (rating !== undefined) {
    values.push(rating);
    fields.push(`rating = $${values.length}`);
  }
  if (review !== undefined) {
    values.push(review);
    fields.push(`review = $${values.length}`);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(userGameId, userId);
  const idParam = values.length - 1;
  const userParam = values.length;

  try {
    const text = `
      UPDATE user_games 
      SET ${fields.join(', ')}
      WHERE id = $${idParam} AND user_id = $${userParam}
      RETURNING *
    `;
    const result = await query(text, values);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Library record not found' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating library game:', error);
    res.status(500).json({ error: 'Failed to update library game' });
  }
};

// DELETE: Remove a game from the authenticated user's library
export const removeGameFromLibrary = async (req: AuthRequest, res: Response): Promise<void> => {
  const userGameId = getIdParam(req.params.id);
  const userId = req.user?.id;

  if (!userGameId || !userId) {
    res.status(404).json({ error: 'Library record not found' });
    return;
  }

  try {
    const result = await query(
      'DELETE FROM user_games WHERE id = $1 AND user_id = $2 RETURNING id',
      [userGameId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Library record not found' });
      return;
    }

    res.status(200).json({ message: 'Game removed from library', id: result.rows[0].id });
  } catch (error) {
    console.error('Error removing game from library:', error);
    res.status(500).json({ error: 'Failed to remove game from library' });
  }
};
