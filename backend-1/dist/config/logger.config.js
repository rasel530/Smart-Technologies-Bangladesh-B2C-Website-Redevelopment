"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoggerConfig = void 0;
const winston = require("winston");
const path = require("path");
const getLoggerConfig = (configService) => {
    const logLevel = configService.get('logging.level') || 'info';
    const logFormat = configService.get('logging.format') || 'json';
    const logFile = configService.get('logging.file') || 'logs/app.log';
    const maxSize = configService.get('logging.maxSize') || '20m';
    const maxFiles = configService.get('logging.maxFiles') || 14;
    const logDir = path.dirname(logFile);
    const logFormats = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), logFormat === 'json'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()));
    const transports = [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            level: configService.get('nodeEnv') === 'production' ? 'warn' : logLevel,
        }),
        new winston.transports.File({
            filename: logFile,
            format: logFormats,
            maxsize: parseInt(maxSize, 10),
            maxFiles: maxFiles,
            level: logLevel,
        }),
        new winston.transports.File({
            filename: logFile.replace('.log', '-error.log'),
            format: logFormats,
            maxsize: parseInt(maxSize, 10),
            maxFiles: maxFiles,
            level: 'error',
        }),
    ];
    if (configService.get('nodeEnv') === 'production') {
    }
    return {
        level: logLevel,
        format: logFormats,
        transports,
        exitOnError: false,
    };
};
exports.getLoggerConfig = getLoggerConfig;
//# sourceMappingURL=logger.config.js.map