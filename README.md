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

## Usage

Provide information about how to use your app. You may want to include API routes here.

## Contributing

Please read `CONTRIBUTING.md` for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
