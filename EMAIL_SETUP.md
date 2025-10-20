# Email Configuration Setup for BeatBazaar

This document explains how to set up email functionality for password reset verification codes in BeatBazaar.

## Overview

The password reset system uses email verification codes to securely reset user passwords. Users can request a password reset by entering their username, and a 6-digit verification code will be sent to their registered email address.

## Email Service Setup

### 1. Environment Configuration

Create a `.env` file in the root directory with the following email configuration:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASS` in your `.env` file

### 3. Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Password Reset Flow

### 1. User Journey
1. User clicks "Forgot your password?" on login page
2. User enters their username
3. System sends verification code to user's email
4. User enters 6-digit verification code
5. User sets new password
6. User is redirected to login page

### 2. Security Features
- **Code Expiration**: Verification codes expire after 15 minutes
- **Single Use**: Each code can only be used once
- **Automatic Cleanup**: Expired codes are automatically removed
- **Email Validation**: Only users with registered email addresses can reset passwords

### 3. API Endpoints

#### POST `/api/auth/forgot-password`
- **Body**: `{ "username": "string" }`
- **Response**: `{ "message": "string", "userId": "string" }`
- **Purpose**: Sends verification code to user's email

#### POST `/api/auth/verify-reset-code`
- **Body**: `{ "userId": "string", "code": "string" }`
- **Response**: `{ "message": "string", "verified": boolean }`
- **Purpose**: Verifies the 6-digit code

#### POST `/api/auth/reset-password`
- **Body**: `{ "userId": "string", "code": "string", "newPassword": "string" }`
- **Response**: `{ "message": "string" }`
- **Purpose**: Updates user's password

## Database Schema

The system uses a `verification_codes` table to store temporary verification codes:

```sql
CREATE TABLE verification_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'password_reset',
  expires_at DATETIME NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Testing

### 1. Development Testing
- Use a test email address for development
- Check email logs in the console for debugging
- Verify codes are properly cleaned up after expiration

### 2. Production Considerations
- Use a dedicated email service (SendGrid, Mailgun, etc.) for production
- Implement rate limiting to prevent abuse
- Monitor email delivery rates
- Set up proper error handling and logging

## Troubleshooting

### Common Issues

1. **"Email configuration error"**
   - Check SMTP credentials in `.env` file
   - Verify email service settings
   - Ensure 2FA is enabled for Gmail

2. **"Failed to send verification email"**
   - Check internet connection
   - Verify SMTP server is accessible
   - Check email service quotas

3. **"Invalid or expired verification code"**
   - Codes expire after 15 minutes
   - Each code can only be used once
   - Check system clock synchronization

### Debug Mode

Enable debug logging by checking the console output for email-related messages:
- `✅ Email server is ready to send messages`
- `✅ Email sent successfully`
- `❌ Email configuration error`

## Security Notes

- Never commit `.env` files to version control
- Use environment variables in production
- Consider implementing rate limiting for password reset requests
- Monitor for suspicious activity patterns
- Regularly rotate email service credentials
