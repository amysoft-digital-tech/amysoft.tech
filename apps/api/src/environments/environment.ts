export const environment = {
  production: false,
  api: {
    port: 3000
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/amysoft_dev'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};