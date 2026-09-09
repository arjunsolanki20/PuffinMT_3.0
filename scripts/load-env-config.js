const fs = require('fs');
const path = require('path');

function loadEnvironmentConfig() {
  const explicitPath = process.env.CYPRESS_ENV_FILE;
  const candidates = [
    explicitPath,
    path.join(process.cwd(), 'cypress.env.local'),
    path.join(process.cwd(), 'cypress.env.json'),
  ].filter(Boolean);

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!envPath) {
    if (explicitPath) {
      throw new Error(`CYPRESS_ENV_FILE does not exist: ${explicitPath}`);
    }

    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(envPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to parse Cypress environment file "${envPath}": ${error.message}`);
  }
}

module.exports = { loadEnvironmentConfig };
