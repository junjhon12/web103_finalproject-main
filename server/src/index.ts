import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';
import gamesRouter from './routes/games';
import userGamesRouter from './routes/userGames'; 

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gamesRouter);
app.use('/api/user-library', userGamesRouter); 

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbRes = await query('SELECT NOW()');
    res.status(200).json({ 
      status: 'ok', 
      timestamp: dbRes.rows[0].now 
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});