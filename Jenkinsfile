pipeline {
    agent any

    environment {
        APP_NAME = 'online-shopping'
        APP_TAG = 'latest'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                // Use 'bat' for Windows agents; use 'sh' for Linux agents
                bat 'npm.cmd install'
            }
        }

        stage('Run Application Tests') {
            steps {
                echo 'Executing automated functional tests...'
                bat 'npm.cmd test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker container image...'
                bat "docker build -t %APP_NAME%:%APP_TAG% ."
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution cycle completed.'
        }
        success {
            echo 'Pipeline SUCCESS! All tests passed and Docker image built.'
        }
        failure {
            echo 'Pipeline FAILED! Check Console Output for error details.'
        }
    }
}
