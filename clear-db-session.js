#!/usr/bin/env node
/**
 * Clear login session from database
 * Clears the isloggedin flag for test user
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
    encrypt: true,
    connectionTimeout: 15000,
    requestTimeout: 15000
  }
};

async function clearLoginSession() {
  const pool = new sql.ConnectionPool(config);

  try {
    console.log('🔌 Connecting to database...');
    await pool.connect();
    console.log('✅ Connected!');

    console.log(`🧹 Clearing login session for ${process.env.TEST_USERNAME}...`);
    const request = pool.request().input(
      'username',
      sql.NVarChar,
      process.env.TEST_USERNAME
    );
    const result = await request.query(
      'UPDATE loginusermaster SET isloggedin=0 WHERE UserName=@username'
    );

    console.log(`✅ Database cleared! Rows affected: ${result.rowsAffected[0]}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

clearLoginSession();
