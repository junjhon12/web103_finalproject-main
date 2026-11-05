import { Pool, types, type PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Return DATE columns (OID 1082) as plain YYYY-MM-DD strings so they never shift
// across time zones when serialized to JSON.
types.setTypeParser(1082, (value: string) => value);

const isLocalHost = (host?: string | null): boolean =>
  !host || host === 'localhost' || host === '127.0.0.1' || host === '::1';

/**
 * Supports both supported connection styles:
 *   1. DATABASE_URL (preferred), e.g. postgres://user:pass@host:5432/db
 *   2. Individual PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE variables
 *
 * TLS is enabled only for remote hosts; a local Postgres usually does not
 * accept SSL connections.
 */
const buildPoolConfig = (): PoolConfig => {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    let hostname = '';
    try {
      hostname = new URL(connectionString).hostname;
    } catch {
      // Let pg surface a clear error if the URL is malformed.
    }

    return {
      connectionString,
      ssl: isLocalHost(hostname) ? undefined : { rejectUnauthorized: false },
    };
  }

  const host = process.env.PGHOST;

  return {
    host,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: isLocalHost(host) ? undefined : { rejectUnauthorized: false },
  };
};

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();
