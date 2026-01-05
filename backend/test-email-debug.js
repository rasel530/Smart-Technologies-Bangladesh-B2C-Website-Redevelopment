/**
 * Debug email configuration
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const configService = require('./services/config');

console.log('========================================');
console.log('📧 Email Configuration Debug');
console.log('========================================\n');

console.log('Environment Variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'MISSING');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log();

console.log('Config Service getEmailConfig():');
const emailConfig = configService.getEmailConfig();
console.log('Full config:', JSON.stringify(emailConfig, null, 2));
console.log();

console.log('Config properties:');
console.log('host:', emailConfig.host);
console.log('port:', emailConfig.port);
console.log('secure:', emailConfig.secure);
console.log('auth:', emailConfig.auth);
console.log('auth.user:', emailConfig.auth?.user);
console.log('auth.pass:', emailConfig.auth?.pass ? '***' : 'MISSING');
console.log('from:', emailConfig.from);
console.log();

console.log('✅ Debug completed');
