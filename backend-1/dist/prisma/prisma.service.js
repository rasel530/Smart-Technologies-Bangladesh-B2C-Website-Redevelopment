"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        const databaseUrl = configService.get('database.url') ||
            `postgresql://${configService.get('database.username')}:${configService.get('database.password')}@${configService.get('database.host')}:${configService.get('database.port')}/${configService.get('database.name')}`;
        console.log('PrismaService - databaseUrl:', databaseUrl);
        super({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
            errorFormat: 'pretty',
        });
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Database connected successfully');
        try {
            await this.$queryRaw `SELECT 1`;
            this.logger.log('Database connection test passed');
        }
        catch (error) {
            this.logger.error('Database connection test failed', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected successfully');
    }
    async healthCheck() {
        try {
            const result = await Promise.race([
                this.$queryRaw `SELECT 1`,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Database health check timeout')), 5000))
            ]);
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
            };
        }
    }
    async executeWithRetry(operation, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries})`, error);
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        this.logger.error('Database operation failed after all retries', lastError);
        throw lastError;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map