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

// POST: Create a new game
export const createGame = async (req: Request<{}, {}, GamePayload>, res: Response): Promise<void> => {
  const { title, platform, genre, cover_image_url } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  try {
    const text = `
      INSERT INTO games (title, platform, genre, cover_image_url) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [title, platform || null, genre || null, cover_image_url || null];
    const result = await query(text, values);
    
    res.status(201).json(result.rows[0] as Game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
};

// PATCH: Update an existing game
export const updateGame = async (req: Request<{ id: string }, {}, Partial<GamePayload>>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, platform, genre, cover_image_url } = req.body;

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
    const values = [title, platform, genre, cover_image_url, id];
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

// DELETE: Remove a game
export const deleteGame = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM games WHERE id = $1 RETURNING id', [id]);

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