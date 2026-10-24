import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../db';

export const resetDatabase = async (req: Request, res: Response): Promise<void> => {
  // Security Guard: Never allow database resets in production
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Forbidden: Cannot reset database in production' });
    return;
  }

  try {
    // 1. Read and execute the schema file to drop and recreate tables
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await query(schemaSql);

    // 2. Seed global games dictionary
    const seedGamesSql = `
      INSERT INTO games (title, platform, genre) VALUES 
      ('The Legend of Zelda: Breath of the Wild', 'Nintendo Switch', 'Action-Adventure'),
      ('Hades', 'PC', 'Roguelike'),
      ('Cyberpunk 2077', 'PC', 'RPG'),
      ('Stardew Valley', 'Multiplatform', 'Simulation'),
      ('Elden Ring', 'PS5', 'Action RPG')
    `;
    await query(seedGamesSql);

    res.status(200).json({ message: 'Database reset and seeded successfully' });
  } catch (error) {
    console.error('Database reset failed:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
};