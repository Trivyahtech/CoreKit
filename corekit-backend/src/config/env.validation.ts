type EnvMap = Record<string, unknown>;

export function validateEnv(config: EnvMap) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const port = Number(config.PORT || 3000);
  if (Number.isNaN(port)) {
    throw new Error('PORT must be a number');
  }

  const redisPort = Number(config.REDIS_PORT || 6379);
  if (Number.isNaN(redisPort)) {
    throw new Error('REDIS_PORT must be a number');
  }

  return config;
}
