import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const buckets = new Map<string, Bucket>();

// Keep the in-memory store from growing forever without a background timer.
const prune = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const rateLimit = ({ windowMs, max, message }: RateLimitOptions) => {
  let requestsSincePrune = 0;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    requestsSincePrune += 1;
    if (requestsSincePrune >= 500) {
      prune(now);
      requestsSincePrune = 0;
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
      });
      return;
    }

    next();
  };
};
