pipeline {
    agent any
    
    environment {
        REGISTRY_URL = 'registry.local:5000'
        IMAGE_NAME   = 'antigravity-server'
        BUILD_TAG    = "${env.BUILD_NUMBER}"
        PATH         = "/opt/go/bin:${env.PATH}"
    }

    stages {
        stage('Install Workspace Dependencies') {
            steps {
                echo 'Installing monorepo Node modules...'
                sh 'yarn install --frozen-lockfile'
                
                echo 'Configuring Python virtual environment...'
                sh 'python3 -m venv packages/server/.venv'
                sh './packages/server/.venv/bin/pip install -r packages/server/requirements.txt'
                
                echo 'Building shared library...'
                sh 'yarn workspace @dusan-game/shared build'
            }
        }

        stage('Static Analysis & Linting') {
            parallel {
                stage('Oxlint & Code Quality') {
                    steps {
                        echo 'Running lint checking...'
                        sh 'yarn workspace client lint'
                    }
                }
                stage('Python PEP8 Verification') {
                    steps {
                        echo 'Verifying Python scripts formatting...'
                        sh './packages/server/.venv/bin/pip install ruff'
                        sh './packages/server/.venv/bin/ruff check packages/server/'
                    }
                }
            }
        }

        stage('Parallel Build & Test') {
            parallel {
                stage('Go Core Service') {
                    steps {
                        echo 'Compiling Go Core microservice...'
                        sh 'cd packages/go-core && go build -v ./...'
                        echo 'Running Go unit tests...'
                        sh 'cd packages/go-core && go test ./...'
                    }
                }
                stage('Node.js Backend & Tests') {
                    steps {
                        echo 'Starting backend ML microservice...'
                        sh './packages/server/.venv/bin/python3 packages/server/src/ml/service.py &'
                        sh 'sleep 2'
                        echo 'Running testEngine validation...'
                        sh 'npx ts-node packages/server/src/testEngine.ts'
                    }
                    post {
                        always {
                            echo 'Cleaning up background microservice processes...'
                            sh "kill \$(lsof -t -i:8000) || true"
                        }
                    }
                }
                stage('React WebGL Client') {
                    steps {
                        echo 'Compiling WebGL client bundle...'
                        sh 'yarn workspace client build'
                    }
                }
            }
        }

        stage('Container Image Creation') {
            steps {
                echo 'Creating Docker production images...'
                sh 'docker build -f Dockerfile.server -t ${REGISTRY_URL}/${IMAGE_NAME}:${BUILD_TAG} .'
                sh 'docker push ${REGISTRY_URL}/${IMAGE_NAME}:${BUILD_TAG}'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build successful. Triggering deployment orchestrator...'
        }
    }
}
