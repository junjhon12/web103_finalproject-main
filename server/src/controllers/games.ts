import { Request, Response } from 'express';
import { query } from '../db';

export interface Game {
  id: number;
  title: string;
  platform: string | null;
  genre: string | null;
  cover_image_url: string | null;
}

export interface GamePayload {
  title: string;
  platform?: string;
  genre?: string;
  cover_image_url?: string;
}

const cleanText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null;

const getIdParam = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// GET: Retrieve all games
export const getGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM games ORDER BY id DESC');
    res.status(200).json(result.rows as Game[]);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
};

// POST: Create a new game, reusing the existing catalogue entry when possible
export const createGame = async (req: Request<{}, {}, GamePayload>, res: Response): Promise<void> => {
  const title = cleanText(req.body.title);

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  if (title.length > 255) {
    res.status(400).json({ error: 'Title must be 255 characters or fewer' });
    return;
  }

  const platform = cleanText(req.body.platform);
  const genre = cleanText(req.body.genre);
  const cover_image_url = cleanText(req.body.cover_image_url);

  try {
    // Prevent the catalogue from filling up with duplicate titles.
    const existing = await query('SELECT * FROM games WHERE LOWER(title) = LOWER($1) LIMIT 1', [title]);
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(200).json(existing.rows[0] as Game);
      return;
    }

    const text = `
      INSERT INTO games (title, platform, genre, cover_image_url) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [title, platform, genre, cover_image_url];
    const result = await query(text, values);

    res.status(201).json(result.rows[0] as Game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
};

// PATCH: Update an existing game
export const updateGame = async (req: Request<{ id: string }, {}, Partial<GamePayload>>, res: Response): Promise<void> => {
  const gameId = getIdParam(req.params.id);
  const { title, platform, genre, cover_image_url } = req.body;

  if (!gameId) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  if (title !== undefined && (!cleanText(title) || String(title).trim().length > 255)) {
    res.status(400).json({ error: 'Title must be between 1 and 255 characters' });
    return;
  }

  try {
    const text = `
      UPDATE games 
      SET title = COALESCE($1, title), 
          platform = COALESCE($2, platform), 
          genre = COALESCE($3, genre), 
          cover_image_url = COALESCE($4, cover_image_url)
      WHERE id = $5 
      RETURNING *
    `;
    const values = [
      title === undefined ? null : cleanText(title),
      platform === undefined ? null : cleanText(platform),
      genre === undefined ? null : cleanText(genre),
      cover_image_url === undefined ? null : cleanText(cover_image_url),
      gameId,
    ];
    const result = await query(text, values);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    res.status(200).json(result.rows[0] as Game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

// DELETE: Remove a game only when no user references it
export const deleteGame = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const gameId = getIdParam(req.params.id);

  if (!gameId) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  try {
    const inUse = await query('SELECT 1 FROM user_games WHERE game_id = $1 LIMIT 1', [gameId]);
    if (inUse.rowCount && inUse.rowCount > 0) {
      res.status(409).json({
        error: 'Cannot delete a game that is in a user library. Remove it from libraries first.',
      });
      return;
    }

    const result = await query('DELETE FROM games WHERE id = $1 RETURNING id', [gameId]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    res.status(200).json({ message: 'Game deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};
