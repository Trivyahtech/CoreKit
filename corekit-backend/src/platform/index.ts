// --- Platform Module ---
export { PlatformModule } from './platform.module.js';

// --- Database ---
export { PrismaModule, PrismaService } from './database/index.js';

// --- Cache ---
export { CacheModule, CacheService } from './cache/index.js';

// --- Queue ---
export { QueueModule } from './queue/index.js';

// --- Mail ---
export { MailModule, EmailService } from './mail/index.js';
export type { EmailPayload, EmailJob } from './mail/index.js';

// --- Health ---
export { HealthModule } from './health/health.module.js';

// --- Config ---
export { appConfig, databaseConfig, authConfig, redisConfig, mailConfig, validateEnv } from './config/index.js';
