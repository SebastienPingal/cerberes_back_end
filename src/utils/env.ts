import dotenv from 'dotenv'

dotenv.config()

// Names of the required variables that are not set: the server then refuses to serve the API
export const missing_env: string[] = []

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    missing_env.push(name)
    return ''
  }
  return value
}

function list(name: string): string[] {
  return required(name)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: process.env.PORT ?? 3000,
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  // Origins of the front-end allowed to call the API with credentials (comma separated)
  CORS_ORIGINS: list('CORS_ORIGINS'),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
}
