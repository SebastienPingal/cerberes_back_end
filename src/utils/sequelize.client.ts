import { Sequelize } from 'sequelize'
import { env } from './env'

const sequelize = new Sequelize(env.DATABASE_URL);

export { sequelize };
