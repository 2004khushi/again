const { Pool } = require('pg');
require('dotenv').config();

// Prisma Client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PostgreSQL Pool (if you still need it for raw queries)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection for PostgreSQL pool
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
};

// Test connection on startup
testConnection();

// Export both prisma and pool
module.exports = {
  prisma, // This exports the Prisma client
  pool,   // This exports the PostgreSQL pool
  query: (text, params) => pool.query(text, params),
  testConnection
};