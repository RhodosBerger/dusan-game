pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'yarn install --frozen-lockfile'
            }
        }

        stage('Run Engine Tests') {
            steps {
                // Ensure 100% green compilation of game engines (Rule 7)
                sh 'npx ts-node packages/server/src/testEngine.ts'
            }
        }

        stage('Compile Monorepo Packages') {
            steps {
                // Build typescript libraries & static bundle (Rule 4 consistency)
                sh 'yarn workspace @dusan-game/shared build'
                sh 'yarn workspace client build'
            }
        }

        stage('Build Docker Images') {
            steps {
                // Build all serverless containers locally
                sh 'docker compose build'
            }
        }
    }
}
