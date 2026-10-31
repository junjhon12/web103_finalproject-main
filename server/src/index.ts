import express, { Express, NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
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
const port = process.env.PORT || 3101;

// Fail fast instead of signing/verifying tokens with an undefined secret.
if (!process.env.JWT_SECRET) {
  console.error('[server]: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

// Render terminates TLS in front of the app, so use the forwarded client IP.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Allow the configured origins (comma-separated) or everything in development.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors((req: Request, callback) => {
    const origin = req.header('Origin');
    // Same-origin and server-to-server requests have no Origin header.
    if (!origin) return callback(null, { origin: true } as CorsOptions);

    if (allowedOrigins.includes(origin)) {
      return callback(null, { origin: true } as CorsOptions);
    }

    // Browsers send an Origin header for same-origin POST/PATCH/DELETE too.
    try {
      if (new URL(origin).host === req.header('Host')) {
        return callback(null, { origin: true } as CorsOptions);
      }
    } catch {
      // Fall through to the rejection below for malformed origins.
    }

    // In development, allow the Vite dev server and other local tools.
    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
      return callback(null, { origin: true } as CorsOptions);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  })
);
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
      timestamp: dbRes.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

// Unknown API routes should always return JSON, never the SPA HTML.
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static React files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  // Express 5 no longer accepts '*' as a route pattern, so use a plain
  // middleware fallback for client-side routing.
  app.use((req: Request, res: Response) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Keep failures as JSON instead of Express's default HTML error page.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled request error:', err);
  const status = err.message === 'Origin is not allowed by CORS' ? 403 : 500;
  res.status(status).json({ error: status === 403 ? err.message : 'Internal server error' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
