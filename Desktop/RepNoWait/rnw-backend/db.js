// db.js
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

// Simple query wrapper (auto-releases client)
const query = async (text, params) => {
  return pool.query(text, params);
};

// Safe client for advanced transactions
const getClient = async () => {
  const client = await pool.connect();
  // Wrap the client with a safe release method
  const safeClient = {
    query: (...args) => client.query(...args),
    release: () => client.release(),
  };
  return safeClient;
};

export default {
  query,
  getClient,
};
