export const environment = {
  production: true,
  api: {
    port: process.env.PORT || 3000
  },
  database: {
    url: process.env.DATABASE_URL
  },
  redis: {
    url: process.env.REDIS_URL
  }
};