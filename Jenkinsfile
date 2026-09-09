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
