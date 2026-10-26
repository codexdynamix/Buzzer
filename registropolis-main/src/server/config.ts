
import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || crypto.randomUUID(),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whisp-chat',
  dbName: process.env.MONGODB_DB_NAME || 'whisp-chat',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  redisUrl: process.env.REDIS_URL,
  isDevelopment: process.env.NODE_ENV !== 'production'
};

// Validate required configuration
const requiredEnvVars = [
  'REDIS_URL'
];

if (!config.isDevelopment) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default config;
