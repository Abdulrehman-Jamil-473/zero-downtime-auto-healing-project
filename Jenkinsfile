pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = credentials('dockerhub-creds')
        IMAGE_NAME = 'abdulrehmanofficial/zero-downtime-backend'
        IMAGE_TAG = "${BUILD_NUMBER}"
        APP_SERVER_IP = '13.214.155.7'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('backend') {
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy (Blue-Green + Health Check + Auto-Rollback)') {
            steps {
                sshagent(credentials: ['app-server-ssh-key']) {
                    sh """
                        scp -o StrictHostKeyChecking=no deploy.sh ec2-user@${APP_SERVER_IP}:/home/ec2-user/deploy.sh
                        ssh -o StrictHostKeyChecking=no ec2-user@${APP_SERVER_IP} '
                            chmod +x /home/ec2-user/deploy.sh
                            /home/ec2-user/deploy.sh ${IMAGE_NAME}:${IMAGE_TAG}
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed — new version deployed with zero downtime.'
        }
        failure {
            echo '❌ Pipeline failed — deploy.sh auto-rolled back if the failure was a health-check failure. Check logs above.'
        }
    }
}
