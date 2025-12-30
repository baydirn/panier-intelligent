/**
 * PostgreSQL Database Configuration
 * Using pg pool for connection management
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'panier_intelligent',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Check if PostgreSQL is configured (password required)
const isPostgresConfigured = process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'CHANGEZ_MOI' && process.env.DB_PASSWORD !== '';

let pool = null;

if (isPostgresConfigured) {
  // Create pool instance only if configured
  pool = new Pool(config);

  // Error handler
  pool.on('error', (err, client) => {
    console.error('[DB] Unexpected error on idle client', err);
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('[DB] ❌ Failed to connect to PostgreSQL:', err.message);
      console.error('[DB] Using config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user
      });
    } else {
      console.log('[DB] ✅ Connected to PostgreSQL at', res.rows[0].now);
    }
  });
} else {
  console.warn('[DB] ⚠️  PostgreSQL NOT configured (DB_PASSWORD not set in .env)');
  console.warn('[DB] Les endpoints /api/prices/* ne fonctionneront pas');
  console.warn('[DB] Pour activer: Éditez backend/.env et ajoutez DB_PASSWORD');
  console.warn('[DB] Voir: backend/db/README.md pour installation PostgreSQL');
}

/**
 * Execute a query with error handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function query(text, params) {
  if (!pool) {
    throw new Error('PostgreSQL not configured. Set DB_PASSWORD in backend/.env');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB Query]', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[DB Query Error]', { text, error: error.message });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
export async function getClient() {
  if (!pool) {
    throw new Error('PostgreSQL not configured. Set DB_PASSWORD in backend/.env');
  }
  
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Monkey patch to track transaction
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };

  // Add transaction helpers
  client.beginTransaction = () => client.query('BEGIN');
  client.commitTransaction = () => client.query('COMMIT');
  client.rollbackTransaction = () => client.query('ROLLBACK');

  // Auto-release on error
  const timeout = setTimeout(() => {
    console.error('[DB] Client checkout timeout - potential leak');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    // Remove monkey patches
    client.query = query;
    client.release = release;
    return release();
  };

  return client;
}

/**
 * Close all connections (for graceful shutdown)
 */
export async function closePool() {
  if (!pool) {
    console.log('[DB] No pool to close (PostgreSQL not configured)');
    return;
  }
  console.log('[DB] Closing connection pool...');
  await pool.end();
  console.log('[DB] Connection pool closed');
}

export { pool };
export default { pool, query, getClient, closePool };
