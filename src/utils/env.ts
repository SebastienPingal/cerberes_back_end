import dotenv from 'dotenv'

dotenv.config()

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Please define the ${name} environment variable inside .env`)
  }
  return value
}

function list(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: process.env.PORT ?? 3000,
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  // Origins allowed to call the API with credentials (comma separated). Empty means none.
  CORS_ORIGINS: list('CORS_ORIGINS'),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
}
