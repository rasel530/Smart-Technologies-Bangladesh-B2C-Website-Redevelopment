"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const configuration_1 = require("./config/configuration");
const logger_config_1 = require("./config/logger.config");
const nest_winston_1 = require("nest-winston");
const auth_module_1 = require("./modules/auth/auth.module");
const middleware_config_1 = require("./middleware/middleware.config");
const core_1 = require("@nestjs/core");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(middleware_config_1.SecurityMiddleware, middleware_config_1.RateLimitMiddleware, middleware_config_1.CompressionMiddleware, middleware_config_1.CorsMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            nest_winston_1.WinstonModule.forRootAsync({
                useFactory: logger_config_1.getLoggerConfig,
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule.forRoot({
                isGlobal: true,
            }),
            auth_module_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map