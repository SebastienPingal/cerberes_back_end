import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    throw new Error('Unable to connect to the database');
  }
}

export { sequelize, testConnection };