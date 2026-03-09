"use strict";
/**
 * Simple Logger Utility
 *
 * Provides basic logging functionality for the application.
 * Logs to console with timestamps and log levels.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const logMessage = {
            timestamp,
            level,
            message,
            data
        };
        return JSON.stringify(logMessage);
    }
    debug(message, data) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(this.formatMessage(LogLevel.DEBUG, message, data));
        }
    }
    info(message, data) {
        console.log(this.formatMessage(LogLevel.INFO, message, data));
    }
    warn(message, data) {
        console.warn(this.formatMessage(LogLevel.WARN, message, data));
    }
    error(message, error) {
        console.error(this.formatMessage(LogLevel.ERROR, message, error));
    }
}
exports.logger = new Logger();
