/**
 * Simple email test to debug Mailtrap connection
 */

const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('========================================');
console.log('📧 Simple Mailtrap Email Test');
console.log('========================================\n');

console.log('Environment Variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'MISSING');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log();

async function testMailtrap() {
  try {
    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully!\n');

    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_FROM}>`,
      to: 'test@example.com',
      subject: 'Mailtrap Test',
      text: 'This is a test email from Mailtrap',
      html: '<p>This is a test email from Mailtrap</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\nCheck your Mailtrap inbox at: https://mailtrap.io/inboxes\n');

  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Error Name:', error.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('\nFull Error:', error);
    console.error('\nStack Trace:', error.stack);
    process.exit(1);
  }
}

testMailtrap()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
