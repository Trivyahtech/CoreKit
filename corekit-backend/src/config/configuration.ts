export default () => ({
  app: {
    name: process.env.APP_NAME || 'Corekit API',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigin: (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((value) => value.trim()),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"CoreKit" <noreply@corekit.dev>',
  },
});
