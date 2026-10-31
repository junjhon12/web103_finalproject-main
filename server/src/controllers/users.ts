import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { query, getClient } from '../db';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const GUEST_RETENTION_DAYS = 7;

export const registerUser = async (req: Request<{}, {}, RegisterPayload>, res: Response): Promise<void> => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  if (username.length > 255) {
    res.status(400).json({ error: 'Username must be 255 characters or fewer' });
    return;
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  let client: PoolClient | undefined;

  try {
    client = await getClient();
    await client.query('BEGIN'); // Start Transaction

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 1. Insert User
    const userText = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, email, created_at
    `;
    const userResult = await client.query(userText, [username, email, password_hash]);
    const newUser = userResult.rows[0];

    // 2. Auto-generate default Goal
    const goalText = `INSERT INTO goals (user_id, target_hours, current_streak) VALUES ($1, $2, $3)`;
    await client.query(goalText, [newUser.id, 10, 0]); // Default 10 hours/week

    await client.query('COMMIT'); // Commit Transaction
    // Never return password_hash to the client.
    res.status(201).json({ id: newUser.id, username: newUser.username });
  } catch (error: any) {
    if (client) await client.query('ROLLBACK').catch(() => undefined); // Rollback on any failure
    console.error('Registration error:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client?.release(); // Return client to the pool
  }
};

// POST: Login user and issue JWT
export const loginUser = async (req: Request<{}, {}, LoginPayload>, res: Response): Promise<void> => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const text = 'SELECT id, username, password_hash FROM users WHERE LOWER(email) = $1';
    const result = await query(text, [email]);

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
};

export const guestLogin = async (req: Request, res: Response): Promise<void> => {
  let client: PoolClient | undefined;

  try {
    client = await getClient();
    await client.query('BEGIN');

    // Remove abandoned guest accounts so the users table does not grow forever.
    await client.query(
      `DELETE FROM users
       WHERE email LIKE '%@gamelog.local'
         AND created_at < NOW() - ($1 || ' days')::INTERVAL`,
      [GUEST_RETENTION_DAYS]
    );

    // 1. Generate a random guest identity
    const guestId = crypto.randomBytes(4).toString('hex');
    const username = `Guest_${guestId}`;
    const email = `${username}@gamelog.local`;

    // We hash a random password since the guest won't actually type it
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), saltRounds);

    // 2. Insert Guest User
    const userText = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, email
    `;
    const userResult = await client.query(userText, [username, email, password_hash]);
    const newUser = userResult.rows[0];

    // 3. Auto-generate default Goal (from our previous custom feature)
    const goalText = `INSERT INTO goals (user_id, target_hours, current_streak) VALUES ($1, $2, $3)`;
    await client.query(goalText, [newUser.id, 10, 0]);

    // 4. Pre-load Games into the Guest's Library dynamically
    const gamesResult = await client.query('SELECT id FROM games ORDER BY id LIMIT 3');

    // Only insert if games actually exist in the database
    if (gamesResult.rows.length >= 3) {
      const preLoadText = `
        INSERT INTO user_games (user_id, game_id, status) VALUES 
        ($1, $2, 'playing'),
        ($1, $3, 'completed'),
        ($1, $4, 'backlog')
      `;

      await client.query(preLoadText, [
        newUser.id,
        gamesResult.rows[0].id,
        gamesResult.rows[1].id,
        gamesResult.rows[2].id,
      ]);
    }

    await client.query('COMMIT');

    // 5. Generate standard JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Failed to create guest session' });
  } finally {
    client?.release();
  }
};
