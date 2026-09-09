#!/usr/bin/env node

/**
 * reset-db.js - Clear the login session from the database
 * This ensures tests can run without "already logged in" errors
 */

const sql = require('mssql');

const requiredEnvironmentVariables = [
  'DB_SERVER',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'TEST_USERNAME'
];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name]
);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  );
}

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    trustServerCertificate: true,
    connectionTimeout: 15000,
    requestTimeout: 15000
  }
};

async function resetDatabase() {
  try {
    console.log('Connecting to database...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Connected to database');

    console.log(`Clearing login session for ${process.env.TEST_USERNAME}...`);
    const result = await pool
      .request()
      .input('username', sql.NVarChar, process.env.TEST_USERNAME)
      .query('UPDATE loginusermaster SET isloggedin=0 WHERE UserName=@username');
    console.log(`✓ Database cleared: ${result.rowsAffected[0]} row(s) updated`);

    await pool.close();
  } catch (err) {
    console.error('✗ Database error:', err.message);
    process.exit(1);
  }
}

resetDatabase();
