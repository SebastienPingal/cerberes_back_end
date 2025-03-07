# Cerberes Back End

## Description

Cerberes is a secure, encrypted chat application. It uses PGP encryption to ensure the privacy of user communications. The messages transit through a server and are then deleted from the server once they've been delivered and decrypted by the recipient. 

## Features

- PGP encryption for secure messages.
- Messages are deleted from the server once delivered.
- Users can generate and retrieve PGP keys using a mnemonic phrase.

## Tech Stack

- TypeScript
- Node.js
- Express.js
- Sequelize (ORM)
- PostgreSQL

## 🐳 Running with Docker

The easiest way to run the application is using Docker Compose:

```bash
# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

This will start both the application and PostgreSQL database with all the necessary environment variables configured.

## 🚀 Running Locally

If you prefer to run the application locally:

1. Make sure you have PostgreSQL installed and running
2. Copy `.env.example` to `.env` and update the values if needed
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

## 📦 Build for Production

```bash
pnpm build
pnpm start
```

## ☁️ AWS Deployment with Terraform

This project can be automatically deployed to AWS using our CI/CD pipeline and Terraform. 

### Prerequisites

- AWS account with appropriate permissions
- GitHub repository with GitHub Actions enabled
- Required GitHub Secrets configured (see below)

### Deployment Process

1. Push your changes to the master branch
2. The CI pipeline checks code quality and builds the application
3. The CD pipeline provisions AWS infrastructure using Terraform
4. Application is deployed to an EC2 instance with a PostgreSQL RDS

### Required GitHub Secrets

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: AWS region for deployment (e.g., us-east-1)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `SSH_KEY_NAME`: Name of the SSH key pair in AWS
- `EC2_SSH_PRIVATE_KEY`: Private SSH key content for connecting to EC2

For more details, see the [Terraform README](terraform/README.md).

## Usage

Provide information about how to use your app. You may want to include API routes here.

## Contributing

Please read `CONTRIBUTING.md` for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
