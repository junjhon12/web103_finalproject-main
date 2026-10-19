import { Request, Response } from 'express';
import { query } from '../db';
import { Game } from './games';

// Extends the base Game interface with user-specific relationship data
export interface PopulatedUserGame extends Game {
  user_game_id: number;
  user_id: number;
  status: string;
  rating: number | null;
  review: string | null;
}

export interface AddGamePayload {
  user_id: number;
  game_id: number;
  status?: string;
}

export interface UpdateLibraryPayload {
  status?: string;
  rating?: number;
  review?: string;
}

// GET: Retrieve a specific user's populated game library using an INNER JOIN
export const getUserLibrary = async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
  const { userId } = req.params;

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

// POST: Add a game to a user's library
export const addGameToLibrary = async (req: Request<{}, {}, AddGamePayload>, res: Response): Promise<void> => {
  const { user_id, game_id, status } = req.body;

  if (!user_id || !game_id) {
    res.status(400).json({ error: 'user_id and game_id are required' });
    return;
  }

  try {
    const text = `
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const values = [user_id, game_id, status || 'backlog'];
    const result = await query(text, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding game to library:', error);
    res.status(500).json({ error: 'Failed to add game to library. It may already exist.' });
  }
};

// PATCH: Update a game's status, rating, or review in the library
export const updateLibraryGame = async (req: Request<{ id: string }, {}, UpdateLibraryPayload>, res: Response): Promise<void> => {
  const { id } = req.params; // This is the user_games.id, not games.id
  const { status, rating, review } = req.body;

  try {
    const text = `
      UPDATE user_games 
      SET status = COALESCE($1, status), 
          rating = COALESCE($2, rating), 
          review = COALESCE($3, review)
      WHERE id = $4 
      RETURNING *
    `;
    const values = [status, rating, review, id];
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

// DELETE: Remove a game from the user's library
export const removeGameFromLibrary = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params; // user_games.id

  try {
    const result = await query('DELETE FROM user_games WHERE id = $1 RETURNING id', [id]);

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