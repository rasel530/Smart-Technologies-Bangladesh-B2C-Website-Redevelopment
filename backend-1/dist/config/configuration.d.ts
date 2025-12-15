declare const _default: () => {
    port: number;
    nodeEnv: string;
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        url: string;
        ssl: boolean;
        connectionLimit: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
        maxRetriesPerRequest: number;
        retryDelayOnFailover: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    elasticsearch: {
        node: string;
        auth: {
            username: string;
            password: string;
        };
        maxRetries: number;
        requestTimeout: number;
    };
    frontend: {
        url: string;
    };
    logging: {
        level: string;
        format: string;
        file: string;
        maxSize: string;
        maxFiles: number;
    };
    monitoring: {
        enabled: boolean;
        metricsPort: number;
        healthCheckInterval: number;
    };
    security: {
        rateLimitWindowMs: number;
        rateLimitMax: number;
        bcryptRounds: number;
        sessionSecret: string;
    };
    cors: {
        origin: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
};
export default _default;
