"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT, 10) || 3001,
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'smart_dev',
        password: process.env.DB_PASSWORD || 'smart_dev_password_2024',
        database: process.env.DB_NAME || 'smart_ecommerce_dev',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'smarttech-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || 'redis_smarttech_2024',
    },
    elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
});
//# sourceMappingURL=configuration.js.map