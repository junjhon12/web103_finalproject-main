import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { query } from './db';
// Route Imports
import gamesRouter from './routes/games';
import userGamesRouter from './routes/userGames';
import playSessionsRouter from './routes/playSessions';
import goalsRouter from './routes/goals';
import usersRouter from './routes/users';
import resetRouter from './routes/reset'; 
import statsRouter from './routes/stats';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/user-library', userGamesRouter);
app.use('/api/play-sessions', playSessionsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/reset', resetRouter); 
app.use('/api/stats', statsRouter);

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

// Serve static React files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});