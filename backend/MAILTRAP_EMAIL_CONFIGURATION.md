# Mailtrap Email Configuration Guide

## Overview

This guide explains how to configure and use Mailtrap for email testing and verification in the Smart Technologies Bangladesh e-commerce application.

## What is Mailtrap?

Mailtrap is a fake SMTP server for development teams to test, view, and share emails sent from the development and staging environments without spamming real customers.

## Benefits of Using Mailtrap

- **Safe Testing**: No risk of sending emails to real users during development
- **Email Preview**: View emails exactly as they appear to recipients
- **Debugging**: Inspect email headers, HTML, and text versions
- **Team Collaboration**: Share test inboxes with team members
- **Free Tier**: Generous free plan for development (500 test emails/month)

## Configuration

### Environment Variables

The following environment variables are configured in `.env`:

```bash
# Mailtrap SMTP Configuration
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=0106834322da5c
SMTP_PASS=****8917
EMAIL_FROM=noreply@smarttech.com

# Frontend URL for email verification links
FRONTEND_URL=http://localhost:3000

# Email Verification (set to false to enable)
DISABLE_EMAIL_VERIFICATION=false
```

### Configuration Details

| Variable       | Value                      | Description                         |
| -------------- | -------------------------- | ----------------------------------- |
| `SMTP_HOST`    | `sandbox.smtp.mailtrap.io` | Mailtrap sandbox SMTP server        |
| `SMTP_PORT`    | `2525`                     | Mailtrap SMTP port (non-SSL)        |
| `SMTP_SECURE`  | `false`                    | Disable SSL for Mailtrap sandbox    |
| `SMTP_USER`    | `0106834322da5c`           | Your Mailtrap inbox username        |
| `SMTP_PASS`    | `****8917`                 | Your Mailtrap inbox password        |
| `EMAIL_FROM`   | `noreply@smarttech.com`    | Default sender email address        |
| `FRONTEND_URL` | `http://localhost:3000`    | Frontend URL for verification links |

## Testing Email Configuration

### Quick Test

Run the email test script to verify your Mailtrap configuration:

```bash
cd backend
node test-email-mailtrap.js
```

This script will:

1. Check email service status
2. Validate email configuration
3. Test email connection
4. Send a test email
5. Send a verification email
6. Send a welcome email
7. Send a password reset email

### Test with Custom Email

To test with a specific email address:

```bash
TEST_EMAIL=your-email@example.com node test-email-mailtrap.js
```

## Viewing Sent Emails

1. Log in to your Mailtrap account at https://mailtrap.io
2. Navigate to your inbox
3. View all emails sent from your application
4. Inspect email content, headers, and attachments

## Email Templates

The application includes the following email templates:

### 1. Verification Email

- **Purpose**: Verify user email address during registration
- **Subject**: "Verify Your Email Address - Smart Technologies Bangladesh"
- **Content**: Verification link with 24-hour expiration
- **Template**: [`createVerificationEmailTemplate()`](services/emailService.js:137)

### 2. Welcome Email

- **Purpose**: Welcome user after successful email verification
- **Subject**: "Welcome to Smart Technologies Bangladesh - Account Activated!"
- **Content**: Welcome message with account features
- **Template**: [`sendWelcomeEmail()`](services/emailService.js:347)

### 3. Password Reset Email

- **Purpose**: Send temporary password and reset link
- **Subject**: "Password Reset - Smart Technologies Bangladesh"
- **Content**: Temporary password and reset link with 1-hour expiration
- **Template**: [`createPasswordResetEmailTemplate()`](services/emailService.js:606)

## Integration with Authentication Flow

### Registration Flow

1. User registers with email and password
2. System generates verification token
3. Email service sends verification email via Mailtrap
4. User clicks verification link
5. System verifies token and activates account
6. System sends welcome email via Mailtrap

### Password Reset Flow

1. User requests password reset
2. System generates temporary password and reset token
3. Email service sends password reset email via Mailtrap
4. User logs in with temporary password
5. User is prompted to change password
6. System updates password

## Switching to Production SMTP

When you're ready to move to production, update your `.env` file with production SMTP credentials:

### Gmail (Example)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### SendGrid (Example)

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

### AWS SES (Example)

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

**Note**: Always use environment-specific configuration files (`.env.production`, `.env.staging`) for production deployments.

## Troubleshooting

### Issue: Emails not appearing in Mailtrap

**Solutions:**

1. Verify Mailtrap credentials in `.env` file
2. Check that `DISABLE_EMAIL_VERIFICATION=false`
3. Ensure backend server is running
4. Check backend logs for email sending errors
5. Verify network connectivity to Mailtrap SMTP server

### Issue: Connection timeout

**Solutions:**

1. Check firewall settings allow outbound SMTP on port 2525
2. Verify Mailtrap service is operational
3. Check your internet connection
4. Try restarting the backend server

### Issue: Authentication failed

**Solutions:**

1. Verify `SMTP_USER` and `SMTP_PASS` are correct
2. Check for typos in credentials
3. Ensure you're using the correct Mailtrap inbox credentials
4. Regenerate Mailtrap credentials if needed

### Issue: Fallback mode activated

**Solutions:**

1. Check if all required SMTP environment variables are set
2. Verify email configuration in backend logs
3. Ensure `DISABLE_EMAIL_VERIFICATION=false`
4. Run `node test-email-mailtrap.js` to diagnose issues

## Best Practices

### Development

- ✅ Use Mailtrap for all development email testing
- ✅ Test all email templates before deployment
- ✅ Verify email links work correctly
- ✅ Check email rendering on different devices
- ✅ Keep Mailtrap credentials secure (don't commit to Git)

### Production

- ✅ Use production SMTP service (SendGrid, AWS SES, etc.)
- ✅ Enable SSL/TLS for secure email transmission
- ✅ Use strong, unique SMTP passwords
- ✅ Monitor email delivery rates and bounces
- ✅ Set up email analytics and tracking

### Security

- ✅ Never commit `.env` file to version control
- ✅ Use `.env.example` for template only
- ✅ Rotate SMTP credentials regularly
- ✅ Use app-specific passwords for Gmail
- ✅ Enable two-factor authentication on Mailtrap account

## Monitoring and Logging

The email service logs all email operations:

```javascript
// Check backend logs for email operations
// Success logs:
info: Verification email sent successfully
info: Welcome email sent successfully
info: Password reset email sent successfully

// Error logs:
error: Failed to send verification email
warn: Email service not available, using fallback mode
```

## Additional Resources

- [Mailtrap Documentation](https://help.mailtrap.io/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Best Practices](https://www.mailgun.com/blog/email-best-practices/)
- [SMTP Configuration Guide](https://docs.sendgrid.com/for-developers/sending-email/smtp)

## Support

For issues or questions:

1. Check backend logs for error messages
2. Run `node test-email-mailtrap.js` for diagnostics
3. Review this documentation
4. Contact development team

## Changelog

### 2024-12-31

- Initial Mailtrap configuration
- Added email test script
- Created comprehensive documentation
- Updated `.env.example` with Mailtrap options
