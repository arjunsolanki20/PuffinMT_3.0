pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
    }

    environment {
        CYPRESS_TENANT = 'KFH'
    }

    stages {
        stage('Verify Runtime') {
            steps {
                sh '''
                    node --version
                    npm --version
                    test "$(node -p "Number(process.versions.node.split('.')[0]) >= 18")" = "true"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --no-audit --no-fund'
                sh 'npx cypress verify'
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
                    sh 'node scripts/reset-db.js'
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
                    sh 'npx cypress run --spec "cypress/e2e/features/login.feature"'
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
