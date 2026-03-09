/**
 * Database Service
 * 
 * Re-exports the JavaScript database service to ensure a single
 * PrismaClient instance is used throughout the application.
 * This prevents connection pool conflicts between JavaScript and TypeScript services.
 */

// Import the JavaScript database service singleton using correct relative path
let databaseService;
try {
  databaseService = require('../../services/database').databaseService;
} catch (error) {
  console.error('[DatabaseService] Failed to import database service:', error);
  throw new Error('Database service initialization failed');
}

// Re-export for TypeScript compatibility
export { databaseService };
