import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { getLoggerConfig } from './config/logger.config';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './modules/auth/auth.module';
// import { HealthModule } from './modules/health/health.module';
import {
  SecurityMiddleware,
  RateLimitMiddleware,
  CompressionMiddleware,
  CorsMiddleware
} from './middleware/middleware.config';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    WinstonModule.forRootAsync({
      useFactory: getLoggerConfig,
      inject: [ConfigService],
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    // HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SecurityMiddleware,
        RateLimitMiddleware,
        CompressionMiddleware,
        CorsMiddleware,
      )
      .forRoutes('*');
  }
}