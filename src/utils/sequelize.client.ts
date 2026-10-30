import { Sequelize } from 'sequelize'
import { env } from './env'

const sequelize = new Sequelize(env.DATABASE_URL);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    throw new Error('Unable to connect to the database');
  }
}

export { sequelize, testConnection };
