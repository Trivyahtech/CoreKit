type EnvMap = Record<string, unknown>;

const WEAK_SECRETS = new Set(['change_me', 'changeme', 'secret', 'password']);

export function validateEnv(config: EnvMap) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const jwtSecret = String(config.JWT_SECRET);
  if (config.NODE_ENV === 'production') {
    if (WEAK_SECRETS.has(jwtSecret.toLowerCase()) || jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET is too weak for production (must be >=32 chars and not a default placeholder)',
      );
    }
  } else if (WEAK_SECRETS.has(jwtSecret.toLowerCase())) {
    console.warn(
      '[WARN] JWT_SECRET is set to a default placeholder. Replace before deploying.',
    );
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
