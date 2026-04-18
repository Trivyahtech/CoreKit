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
});
