"use strict";
/**
 * Database Service
 *
 * Re-exports the JavaScript database service to ensure a single
 * PrismaClient instance is used throughout the application.
 * This prevents connection pool conflicts between JavaScript and TypeScript services.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = void 0;
// Import the JavaScript database service singleton using absolute path
const { databaseService } = require('../../../services/database');
exports.databaseService = databaseService;
