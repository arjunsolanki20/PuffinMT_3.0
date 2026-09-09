pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
    }

    environment {
        CYPRESS_TENANT = 'KFH'
        NODE_OPTIONS = '--max-old-space-size=8192'
    }

    stages {

        stage('Verify Runtime') {
            steps {
                sh '''
                    echo "===== Runtime ====="
                    node --version
                    npm --version

                    node -e "console.log('Node major:', process.versions.node.split('.')[0])"

                    test "$(node -p "Number(process.versions.node.split('.')[0]) >= 22")" = "true"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci --no-audit --no-fund
                    npx cypress verify
                '''
            }
        }

        stage('Check Cypress Environment') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'puffin-cypress-env',
                        variable: 'CYPRESS_ENV_FILE'
                    )
                ]) {
                    sh '''
                        echo "===== Cypress Environment ====="
                        echo "Environment file exists:"
                        test -f "$CYPRESS_ENV_FILE"

                        echo "Environment file path:"
                        echo "$CYPRESS_ENV_FILE"

                        echo "Checking required values..."

                        node - <<'NODE'
const fs = require('fs');

const file = process.env.CYPRESS_ENV_FILE;

if (!file || !fs.existsSync(file)) {
    console.error('CYPRESS_ENV_FILE does not exist');
    process.exit(1);
}

const env = JSON.parse(fs.readFileSync(file, 'utf8'));

console.log('USERNAME:', env.USERNAME);
console.log('TENANT:', env.TENANT);
console.log('DB_SERVER:', env.DB_SERVER);
console.log('DB_NAME:', env.DB_NAME);

if (!env.USERNAME) {
    throw new Error('USERNAME is missing');
}

if (!env.TENANT) {
    throw new Error('TENANT is missing');
}

if (!env.DB_SERVER) {
    throw new Error('DB_SERVER is missing');
}

if (!env.DB_NAME) {
    throw new Error('DB_NAME is missing');
}

console.log('Environment validation passed');
NODE
                    '''
                }
            }
        }

        stage('Unlock Test User') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'puffin-cypress-env',
                        variable: 'CYPRESS_ENV_FILE'
                    )
                ]) {
                    sh '''
                        node scripts/reset-db.js
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'puffin-cypress-env',
                        variable: 'CYPRESS_ENV_FILE'
                    )
                ]) {
                    sh '''
                        npx cypress run \
                          --spec "cypress/e2e/features/login.feature"
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts(
                artifacts: 'cypress/reports/**,cypress/screenshots/**,cypress/videos/**,allure-results/**',
                allowEmptyArchive: true
            )
        }
    }
}
