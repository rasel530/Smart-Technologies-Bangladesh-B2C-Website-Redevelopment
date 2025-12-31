const { configService } = require('./services/config');

// Test script to verify email and phone verification disabling
console.log('🧪 Testing Verification Disable Functionality\n');

// Set testing mode environment variables for this test
process.env.TESTING_MODE = 'true';
process.env.DISABLE_EMAIL_VERIFICATION = 'true';
process.env.DISABLE_PHONE_VERIFICATION = 'true';

// Reload config to pick up new environment variables
delete require.cache[require.resolve('./services/config')];
const { configService: freshConfigService } = require('./services/config');

console.log('📋 Configuration Status:');
console.log('Testing Mode:', freshConfigService.isTestingMode());
console.log('Email Verification Disabled:', freshConfigService.isEmailVerificationDisabled());
console.log('Phone Verification Disabled:', freshConfigService.isPhoneVerificationDisabled());

console.log('\n🔧 Testing Configuration Methods:');
const testingConfig = freshConfigService.getTestingConfig();
console.log('Testing Config:', JSON.stringify(testingConfig, null, 2));

console.log('\n✅ Expected Behavior:');
console.log('- Registration should auto-activate accounts');
console.log('- Login should skip verification checks');
console.log('- Email verification middleware should bypass checks');
console.log('- Phone verification middleware should bypass checks');

console.log('\n🌍 Environment Variables to Set:');
console.log('TESTING_MODE=true');
console.log('DISABLE_EMAIL_VERIFICATION=true');
console.log('DISABLE_PHONE_VERIFICATION=true');

console.log('\n📝 Usage Examples:');
console.log('# Enable testing mode');
console.log('export TESTING_MODE=true');
console.log('export DISABLE_EMAIL_VERIFICATION=true');
console.log('export DISABLE_PHONE_VERIFICATION=true');
console.log('npm run dev');

console.log('\n# Or in .env file');
console.log('TESTING_MODE=true');
console.log('DISABLE_EMAIL_VERIFICATION=true');
console.log('DISABLE_PHONE_VERIFICATION=true');

console.log('\n🚀 Testing mode is now ready for use!');