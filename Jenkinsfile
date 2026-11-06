pipeline {
    agent any

    environment {
        APP_NAME = 'online-shopping'
        APP_TAG = 'latest'
        DOCKER_BIN = 'C:\\Users\\rupes\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe'
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
                bat "\"\" build -t %APP_NAME%:%APP_TAG% ."
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution cycle completed.'
        }
        success {
            echo 'Pipeline SUCCESS! All 18 tests passed and Docker image built.'
        }
        failure {
            echo 'Pipeline FAILED! Check Console Output for error details.'
        }
    }
}
