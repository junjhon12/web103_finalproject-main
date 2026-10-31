import { Request, Response } from 'express';
import { query } from '../db';

const SEED_GAMES = [
  ['The Legend of Zelda: Breath of the Wild', 'Nintendo Switch', 'Action-Adventure'],
  ['Hades', 'PC', 'Roguelike'],
  ['Cyberpunk 2077', 'PC', 'RPG'],
  ['Stardew Valley', 'Multiplatform', 'Simulation'],
  ['Elden Ring', 'PS5', 'Action RPG'],
];

export const resetDatabase = async (req: Request, res: Response): Promise<void> => {
  // Security Guard: Never allow database resets in production
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Forbidden: Cannot reset database in production' });
    return;
  }

  try {
    // TRUNCATE is atomic and resets identities, unlike re-running a schema file.
    await query(
      'TRUNCATE TABLE play_sessions, goals, user_games, games, users RESTART IDENTITY CASCADE'
    );

    for (const [title, platform, genre] of SEED_GAMES) {
      await query(
        'INSERT INTO games (title, platform, genre) VALUES ($1, $2, $3)',
        [title, platform, genre]
      );
    }

    res.status(200).json({ message: 'Database reset and seeded successfully' });
  } catch (error) {
    console.error('Database reset failed:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
};
