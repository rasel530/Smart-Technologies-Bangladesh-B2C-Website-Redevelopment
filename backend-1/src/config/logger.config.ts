import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';

export const getLoggerConfig = (configService: ConfigService) => {
  const logLevel = configService.get<string>('logging.level') || 'info';
  const logFormat = configService.get<string>('logging.format') || 'json';
  const logFile = configService.get<string>('logging.file') || 'logs/app.log';
  const maxSize = configService.get<string>('logging.maxSize') || '20m';
  const maxFiles = configService.get<number>('logging.maxFiles') || 14;

  // Ensure logs directory exists
  const logDir = path.dirname(logFile);
  
  const logFormats = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    logFormat === 'json' 
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  );

  const transports = [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: configService.get<string>('nodeEnv') === 'production' ? 'warn' : logLevel,
    }),
    
    // File transport for all environments
    new winston.transports.File({
      filename: logFile,
      format: logFormats,
      maxsize: parseInt(maxSize, 10),
      maxFiles: maxFiles,
      level: logLevel,
    }),
    
    // Separate error file
    new winston.transports.File({
      filename: logFile.replace('.log', '-error.log'),
      format: logFormats,
      maxsize: parseInt(maxSize, 10),
      maxFiles: maxFiles,
      level: 'error',
    }),
  ];

  // Add external logging services in production
  if (configService.get<string>('nodeEnv') === 'production') {
    // You can add external logging services here
    // For example: Elasticsearch, CloudWatch, etc.
  }

  return {
    level: logLevel,
    format: logFormats,
    transports,
    exitOnError: false,
  };
};