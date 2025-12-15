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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsMiddleware = exports.CompressionMiddleware = exports.RateLimitMiddleware = exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express_rate_limit_1 = require("express-rate-limit");
const helmet_1 = require("helmet");
const compression_1 = require("compression");
let SecurityMiddleware = class SecurityMiddleware {
    constructor(configService) {
        this.configService = configService;
    }
    use(req, res, next) {
        (0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        })(req, res, next);
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityMiddleware);
class RateLimitMiddleware {
    constructor(configService) {
        this.configService = configService;
    }
    use(req, res, next) {
        const rateLimitMiddleware = (0, express_rate_limit_1.rateLimit)({
            windowMs: this.configService.get('security.rateLimitWindowMs') || 900000,
            max: this.configService.get('security.rateLimitMax') || 100,
            message: {
                error: 'Too many requests from this IP, please try again later.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        rateLimitMiddleware(req, res, next);
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
class CompressionMiddleware {
    use(req, res, next) {
        (0, compression_1.default)({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression_1.default.filter(req, res);
            },
            threshold: 1024,
            level: 6,
        })(req, res, next);
    }
}
exports.CompressionMiddleware = CompressionMiddleware;
class CorsMiddleware {
    constructor(configService) {
        this.configService = configService;
    }
    use(req, res, next) {
        const allowedOrigins = this.configService.get('cors.origin') || ['http://localhost:3000'];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin) || !origin) {
            res.header('Access-Control-Allow-Origin', origin || '*');
        }
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
            return;
        }
        next();
    }
}
exports.CorsMiddleware = CorsMiddleware;
//# sourceMappingURL=middleware.config.js.map