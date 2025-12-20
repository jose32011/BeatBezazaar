import nodemailer from 'nodemailer';

// Default email configuration (fallback to environment variables)
const getDefaultEmailConfig = () => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Create default transporter
const defaultConfig = getDefaultEmailConfig();
const defaultTransporter = nodemailer.createTransport(defaultConfig);

// Only verify if auth credentials look provided; otherwise skip noisy verification
if (defaultConfig.auth && defaultConfig.auth.user && defaultConfig.auth.pass) {
  defaultTransporter.verify((error: any, success: any) => {
    if (error) {
      } else {
      }
  });
} else {
  }

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromName?: string;
  fromEmail?: string;
}

// Get email configuration with priority: Database > Environment Variables
export async function getEmailConfig(storage?: any): Promise<EmailConfig | null> {
  try {
    // Try to get database settings first
    if (storage) {
      const dbSettings = await storage.getEmailSettings();
      if (dbSettings && dbSettings.enabled && dbSettings.smtpHost && dbSettings.smtpUser && dbSettings.smtpPass) {
        return {
          host: dbSettings.smtpHost,
          port: dbSettings.smtpPort,
          secure: dbSettings.smtpSecure,
          auth: {
            user: dbSettings.smtpUser,
            pass: dbSettings.smtpPass
          },
          fromName: dbSettings.fromName || 'BeatBazaar',
          fromEmail: dbSettings.fromEmail || dbSettings.smtpUser
        };
      }
    }

    // Fallback to environment variables
    const envConfig = getDefaultEmailConfig();
    if (envConfig.auth.user && envConfig.auth.pass) {
      return {
        ...envConfig,
        fromName: process.env.SMTP_FROM_NAME || 'BeatBazaar',
        fromEmail: process.env.SMTP_FROM_EMAIL || envConfig.auth.user
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting email configuration:', error);
    return null;
  }
}

export async function sendEmail(options: EmailOptions, customConfig?: EmailConfig, storage?: any): Promise<boolean> {
  try {
    let config = customConfig;
    
    // If no custom config provided, get the best available configuration
    if (!config) {
      config = await getEmailConfig(storage);
      if (!config) {
        console.error('No email configuration available');
        return false;
      }
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });

    const fromName = config.fromName || 'BeatBazaar';
    const fromEmail = config.fromEmail || config.auth.user;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

export function createPasswordResetEmail(code: string, username: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - BeatBazaar</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .code {
          background-color: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          font-size: 24px;
          font-weight: bold;
          color: #495057;
          letter-spacing: 3px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 14px;
          color: #6c757d;
          text-align: center;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎵 BeatBazaar</div>
          <h1>Password Reset Request</h1>
        </div>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>We received a request to reset your password for your BeatBazaar account. Use the verification code below to proceed with resetting your password:</p>
        
        <div class="code">${code}</div>
        
        <div class="warning">
          <strong>Important:</strong> This code will expire in 15 minutes for security reasons. If you didn't request this password reset, please ignore this email.
        </div>
        
        <p>If you're having trouble with the verification code, please contact our support team.</p>
        
        <div class="footer">
          <p>Best regards,<br>The BeatBazaar Team</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
