"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT, 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'smart_dev',
        password: process.env.DB_PASSWORD || 'smart_dev_password_2024',
        name: process.env.DB_NAME || 'smart_ecommerce_dev',
        url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME || 'smart_dev'}:${process.env.DB_PASSWORD || 'smart_dev_password_2024'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'smart_ecommerce_dev'}`,
        ssl: process.env.NODE_ENV === 'production',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 20,
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || 'redis_smarttech_2024',
        db: parseInt(process.env.REDIS_DB, 10) || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'smarttech-jwt-secret-key-2024',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
        },
        maxRetries: 3,
        requestTimeout: 30000,
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        file: process.env.LOG_FILE || 'logs/app.log',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
    },
    monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT, 10) || 9090,
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
    },
    security: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
        sessionSecret: process.env.SESSION_SECRET || 'smarttech-session-secret-2024',
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
});
//# sourceMappingURL=configuration.js.map