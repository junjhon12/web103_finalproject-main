import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../db';
import crypto from 'crypto';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = async (req: Request<{}, {}, RegisterPayload>, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  const client = await getClient();

  try {
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
    res.status(201).json(newUser);
  } catch (error: any) {
    await client.query('ROLLBACK'); // Rollback on any failure
    console.error('Registration error:', error);
    if (error.code === '23505') { 
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release(); // Return client to the pool
  }
};

// POST: Login user and issue JWT
export const loginUser = async (req: Request<{}, {}, LoginPayload>, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const text = 'SELECT id, username, password_hash FROM users WHERE email = $1';
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
      user: { id: user.id, username: user.username } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
};

export const guestLogin = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

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

    // 4. Pre-load Games into the Guest's Library
    // Assuming IDs 1, 2, and 3 match the Zelda, Hades, and Cyberpunk seeds from your reset script
    const preLoadText = `
      INSERT INTO user_games (user_id, game_id, status) VALUES 
      ($1, 1, 'playing'),
      ($1, 2, 'completed'),
      ($1, 3, 'backlog')
    `;
    await client.query(preLoadText, [newUser.id]);

    await client.query('COMMIT');

    // 5. Generate standard JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '24h' }
    );

    res.status(200).json({ token, user: newUser });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Failed to create guest session' });
  } finally {
    client.release();
  }
};