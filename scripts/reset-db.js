#!/usr/bin/env node

/**
 * reset-db.js - Clear the login session from the database
 * This ensures tests can run without "already logged in" errors
 */

const sql = require('mssql');
const { loadEnvironmentConfig } = require('./load-env-config');

const environmentConfig = loadEnvironmentConfig();
const dbServer = process.env.DB_SERVER || environmentConfig.DB_SERVER;
const dbName = process.env.DB_NAME || environmentConfig.DB_NAME;
const dbUser = process.env.DB_USER || environmentConfig.DB_USER;
const dbPassword = process.env.DB_PASSWORD || environmentConfig.DB_PASSWORD;
const testUsername = process.env.TEST_USERNAME || environmentConfig.USERNAME;
const requiredConfiguration = {
  DB_SERVER: dbServer,
  DB_NAME: dbName,
  DB_USER: dbUser,
  DB_PASSWORD: dbPassword,
  TEST_USERNAME: testUsername,
};
const missingEnvironmentVariables = Object.entries(requiredConfiguration)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  );
}

const config = {
  server: dbServer,
  database: dbName,
  authentication: {
    type: 'default',
    options: {
      userName: dbUser,
      password: dbPassword
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

    console.log(`Clearing login session for ${testUsername}...`);
    const result = await pool
      .request()
      .input('username', sql.NVarChar, testUsername)
      .query('UPDATE loginusermaster SET isloggedin=0 WHERE UserName=@username');
    console.log(`✓ Database cleared: ${result.rowsAffected[0]} row(s) updated`);

    await pool.close();
  } catch (err) {
    console.error('✗ Database error:', err.message);
    process.exit(1);
  }
}

resetDatabase();
