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
                    usernamePassword(
                        credentialsId: 'puffin-ui-login',
                        usernameVariable: 'TEST_USERNAME',
                        passwordVariable: 'PUFFIN_UI_PASSWORD'
                    ),
                    usernamePassword(
                        credentialsId: 'puffin-db-login',
                        usernameVariable: 'DB_USER',
                        passwordVariable: 'DB_PASSWORD'
                    ),
                    string(
                        credentialsId: 'puffin-db-server',
                        variable: 'DB_SERVER'
                    ),
                    string(
                        credentialsId: 'puffin-db-name',
                        variable: 'DB_NAME'
                    )
                ]) {
                    sh 'node scripts/reset-db.js'
                }
            }
        }

        stage('Run Tests') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'puffin-ui-login',
                        usernameVariable: 'CYPRESS_USERNAME',
                        passwordVariable: 'CYPRESS_PASSWORD'
                    )
                ]) {
                    sh 'npm test'
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
