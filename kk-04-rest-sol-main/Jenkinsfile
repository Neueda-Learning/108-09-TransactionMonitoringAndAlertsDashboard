pipeline {

    agent any

    environment {
        GIT_URL = 'https://github.com/neueda-learning/kk-04-rest-sol.git'
        BRANCH = 'main'
    }

    stages {

        stage('Checkout Source') {
            steps {
                git branch: "${BRANCH}",
                    url: "${GIT_URL}"
            }
        }

        stage('Stop Existing Containers') {
            steps {
                sh 'docker-compose down || true'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker-compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose up -d'
            }
        }

        stage('Verify') {
            steps {
                sh 'docker ps'
            }
        }
    }
}
// pipeline {
//     agent any
//     stages {
//     stage('checkout') {
//         steps{
//             git branch: 'main',
//             url: 'https://github.com/neueda-learning/kk-04-rest-sol.git'
//         }
//     }
//     stage ('Environment'){
//     environment {
//         JAVA_HOME = '/usr/lib/jvm/java-21-amazon-corretto.x86_64'
//         PATH = "${JAVA_HOME}/bin:${PATH}"
//     }
//     steps{
//             echo 'Java Version'
//             sh 'java -version'
//             echo 'Javac Version'
//             sh 'javac -version'
//             echo 'Maven Version'
//             sh 'mvn -version'
//             echo 'JAVA_HOME'
//             sh 'echo $JAVA_HOME'
//             echo 'PATH'
//             sh 'echo $PATH'
//         }
//     }
//     stage('Build') {
//         steps {
//             echo 'building...'
//             // Add test steps here
// //             sh 'mvn clean package -DskipTests'
//         }
//     }
//         stage('Deploy') {
//             steps {
//                 echo 'Deploying...'
//                 // Add deploy steps here
//                 sh 'docker compose down || true'
//                 sh 'docker compose up -d --build'
//             }
//         }
//     }
// }