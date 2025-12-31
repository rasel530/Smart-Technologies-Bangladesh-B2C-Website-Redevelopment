# Testing Mode Documentation

## Overview

The email and phone verification systems can be temporarily disabled for testing purposes using the new testing mode configuration. This allows developers to test the application functionality without requiring actual email or SMS verification.

## Environment Variables

To enable testing mode, set the following environment variables:

### Primary Testing Mode
```bash
TESTING_MODE=true
```
When enabled, this disables both email and phone verification.

### Individual Verification Controls
```bash
# Disable email verification only
DISABLE_EMAIL_VERIFICATION=true

# Disable phone verification only  
DISABLE_PHONE_VERIFICATION=true
```

## Usage Examples

### Method 1: Environment Variables (Linux/macOS)
```bash
export TESTING_MODE=true
export DISABLE_EMAIL_VERIFICATION=true
export DISABLE_PHONE_VERIFICATION=true
npm run dev
```

### Method 2: Environment Variables (Windows)
```cmd
set TESTING_MODE=true
set DISABLE_EMAIL_VERIFICATION=true
set DISABLE_PHONE_VERIFICATION=true
npm run dev
```

### Method 3: .env File
Add to your `.env` file:
```env
TESTING_MODE=true
DISABLE_EMAIL_VERIFICATION=true
DISABLE_PHONE_VERIFICATION=true
```

## Behavior Changes

### When Testing Mode is Enabled:

1. **Registration**
   - Users are automatically activated (status set to 'ACTIVE')
   - Email verification tokens are not generated or sent
   - Phone OTP are not generated or sent
   - Accounts are marked as verified immediately

2. **Login**
   - Pending users are automatically activated during login
   - Verification checks are bypassed
   - Users can login without email/phone verification

3. **Middleware**
   - Email verification middleware bypasses all checks
   - Phone verification middleware bypasses all checks
   - All protected routes become accessible

### Response Examples

#### Registration Response (Testing Mode)
```json
{
  "message": "Registration successful in testing mode. Account is automatically activated.",
  "messageBn": "টেস্টিং মোডে নিবন্ধন সফল। অ্যাকাউন্ট স্বয়ংক্রিয় সক্রিয় করা হয়েছে।",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+8801712345678",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "emailVerified": "2024-12-18T10:22:44.122Z",
    "phoneVerified": null
  },
  "testingMode": true,
  "verificationSkipped": true
}
```

#### Normal Registration Response (For Comparison)
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "messageBn": "নিবন্ধন সফল। আপনার অ্যাকাউন্ট যাচাই করার জন্য ইমেল চেক করুন।",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "status": "PENDING"
  },
  "requiresEmailVerification": true
}
```

## Configuration Methods

### Check Testing Mode Status
```javascript
const { configService } = require('./services/config');

// Check individual flags
const isTestingMode = configService.isTestingMode();
const isEmailDisabled = configService.isEmailVerificationDisabled();
const isPhoneDisabled = configService.isPhoneVerificationDisabled();

// Get all testing configuration
const testingConfig = configService.getTestingConfig();
```

## Security Considerations

⚠️ **IMPORTANT**: Testing mode should NEVER be enabled in production environments.

1. **Development Only**: Use only in development and testing environments
2. **No Verification**: All security checks are bypassed
3. **Auto-activation**: Any registration creates active accounts
4. **No Rate Limiting**: Verification rate limits are bypassed

## Testing Script

Run the verification test script to confirm configuration:

```bash
cd backend
node test-verification-disabled.js
```

This will show:
- Current configuration status
- Expected behavior
- Usage examples

## Files Modified

1. **backend/services/config.js**
   - Added testing configuration flags
   - Added helper methods for checking testing mode

2. **backend/routes/auth.js**
   - Modified registration endpoint to skip verification
   - Modified login endpoint to auto-activate pending users
   - Added testing mode logic

3. **backend/middleware/emailVerification.js**
   - Added bypass logic for testing mode
   - Skips verification checks when disabled

4. **backend/middleware/phoneVerification.js**
   - Added bypass logic for testing mode
   - Skips verification checks when disabled

5. **backend/test-verification-disabled.js**
   - New test script for verification functionality
   - Shows configuration status and usage examples

## Reverting Changes

To disable testing mode and restore normal verification:

1. Remove environment variables:
   ```bash
   unset TESTING_MODE
   unset DISABLE_EMAIL_VERIFICATION
   unset DISABLE_PHONE_VERIFICATION
   ```

2. Or remove from `.env` file

3. Restart the application

## Troubleshooting

### Verification Still Required
- Check that environment variables are properly set
- Restart the application after setting variables
- Verify using the test script

### Configuration Not Loading
- Clear Node.js module cache: `npm run dev` (restart)
- Check `.env` file format
- Verify environment variable names

### Accounts Not Auto-activating
- Ensure `TESTING_MODE=true` is set
- Check that config service is imported in routes
- Verify database connection

## Support

For issues with testing mode configuration:
1. Run the test script first
2. Check environment variables
3. Review application logs
4. Verify all modified files are correctly deployed

---
**Version**: 1.0.0  
**Last Updated**: 2024-12-18  
**Author**: Smart Technologies Bangladesh Development Team