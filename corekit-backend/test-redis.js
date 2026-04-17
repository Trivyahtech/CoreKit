require('dotenv').config();
const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });
redis.on('error', (err) => console.log('Redis error:', err));
redis.ping().then(console.log).catch(console.log).finally(() => process.exit());
