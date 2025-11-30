import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isMysqlConfigured, checkDbAndAdmin, writeEnvAndCreateAdmin } from "./setup";
import { insertBeatSchema, insertPurchaseSchema, insertUserSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { sendEmail, generateVerificationCode, createPasswordResetEmail } from "./email";

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    role?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // CORS configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // helper to ensure we have a userId (TypeScript narrowing)
  const ensureUserId = (req: any, res: any): string | null => {
    const uid = req.session?.userId as string | undefined;
    if (!uid) {
      res.status(401).json({ error: 'Not authenticated' });
      return null;
    }
    return uid;
  };
  
  // Configure multer for file uploads
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'audio') {
        cb(null, 'uploads/audio/');
      } else if (file.fieldname === 'image') {
        cb(null, 'uploads/images/');
      } else {
        cb(null, 'uploads/');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'audio') {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed for audio field'));
        }
      } else if (file.fieldname === 'image') {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed for image field'));
        }
      } else {
        cb(null, true);
      }
    }
  });

  // Log audio file requests
  app.use('/uploads/audio', (req, res, next) => {
    console.log(`Audio file requested: ${req.path}`);
    next();
  });

  // Serve uploaded files statically with proper MIME types
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
      if (path.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
        console.log(`Serving MP3 file: ${path}`);
      } else if (path.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
        console.log(`Serving WAV file: ${path}`);
      } else if (path.endsWith('.m4a')) {
        res.setHeader('Content-Type', 'audio/mp4');
        console.log(`Serving M4A file: ${path}`);
      } else if (path.endsWith('.ogg')) {
        res.setHeader('Content-Type', 'audio/ogg');
        console.log(`Serving OGG file: ${path}`);
      }
    }
  }));

  // Test endpoint for audio files
  app.get('/test-audio/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('uploads', 'audio', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(path.resolve(filePath));
  });

  // Secure download endpoint for purchased songs
  app.get('/api/download/:beatId', requireAuth, async (req, res) => {
    try {
      const { beatId } = req.params;
      const userId = req.session?.userId as string | undefined;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      // Check if user has a completed purchase for this beat
      const owns = await storage.userOwnsBeat(userId, beatId);
      if (!owns) {
        return res.status(403).json({ error: 'You have not purchased this song' });
      }

      // Get beat details
      const beat = await storage.getBeat(beatId);
      if (!beat || !beat.audioUrl) {
        return res.status(404).json({ error: 'Audio file not found' });
      }

      // Extract filename from audioUrl
      const filename = beat.audioUrl.split('/').pop() || `${beat.title}.mp3`;
      const filePath = path.join(process.cwd(), beat.audioUrl);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Audio file not found on server' });
      }

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${beat.title} - ${beat.producer}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        res.status(500).json({ error: 'Error downloading file' });
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });
  
  // Session middleware
  const sessionStore = new (MemoryStore(session))({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'beatbazaar-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for Render deployment
      httpOnly: true,
      sameSite: 'lax', // Use 'lax' for better compatibility
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'beatbazaar.sid' // Custom session name
  }));

  // Debug endpoint to check admin user (remove in production)
  app.get("/api/debug/admin", async (req, res) => {
    try {
      const adminUser = await storage.getUserByUsername("admin");
      const allUsers = await storage.getAllUsers();
      
      res.json({
        adminUserExists: !!adminUser,
        adminUser: adminUser ? {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          email: adminUser.email
        } : null,
        totalUsers: allUsers.length,
        allUsers: allUsers.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Setup endpoints - check status and configure DB + initial admin
  app.get('/api/setup/status', async (req, res) => {
    try {
      const status = await checkDbAndAdmin();
      res.json(status);
    } catch (error) {
      console.error('Setup status error:', error);
      res.status(500).json({ error: 'Failed to check setup status' });
    }
  });

  app.post('/api/setup/configure', async (req, res) => {
    try {
      const {
        dbHost,
        dbPort,
        dbUser,
        dbPassword,
        dbName,
        adminUsername,
        adminEmail,
        adminPassword,
        existingAdminUsername,
        existingAdminPassword
      } = req.body;

      if (!dbHost || !dbUser || !dbName || !adminUsername || !adminPassword) {
        return res.status(400).json({ error: 'Missing required database or admin fields' });
      }

      // If currently configured, require admin authentication to update settings
      if (isMysqlConfigured()) {
        if (!existingAdminUsername || !existingAdminPassword) {
          return res.status(401).json({ error: 'Admin authentication required to update settings' });
        }

        const verified = await storage.verifyPassword(existingAdminUsername, existingAdminPassword);
        if (!verified || verified.role !== 'admin') {
          return res.status(403).json({ error: 'Invalid admin credentials' });
        }
      }

      const dbCfg = {
        host: dbHost,
        port: dbPort || 3306,
        user: dbUser,
        password: dbPassword || '',
        database: dbName
      };

      const result = await writeEnvAndCreateAdmin(dbCfg, { username: adminUsername, email: adminEmail, password: adminPassword });

      res.json({ success: true, ...result, restartRequired: true });
    } catch (error) {
      console.error('Setup configure error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to configure' });
    }
  });

  // Check MySQL connection using provided credentials (does not persist)
  app.post('/api/setup/check-connection', async (req, res) => {
    try {
      const { dbHost, dbPort, dbUser, dbPassword, dbName } = req.body || {};
      if (!dbHost || !dbUser || !dbName) {
        return res.status(400).json({ error: 'Missing required fields (host, user, database)' });
      }

  const mysql = await import('mysql2/promise');

      // Try connecting to the provided database
      let connection;
      try {
        connection = await mysql.createConnection({
          host: dbHost,
          port: Number(dbPort) || 3306,
          user: dbUser,
          password: dbPassword || '',
          database: dbName,
          connectTimeout: 5000
        });
        // run a simple query
        await connection.query('SELECT 1');
        await connection.end();
        return res.json({ ok: true, canConnect: true, databaseExists: true });
      } catch (err: any) {
        // If database doesn't exist, try connecting without database to check server/credentials
        if (err && err.code === 'ER_BAD_DB_ERROR') {
          try {
            connection = await mysql.createConnection({
              host: dbHost,
              port: Number(dbPort) || 3306,
              user: dbUser,
              password: dbPassword || '',
              connectTimeout: 5000
            });
            await connection.end();
            return res.json({ ok: true, canConnect: true, databaseExists: false });
          } catch (err2: any) {
            return res.status(400).json({ ok: false, error: String(err2.message || err2) });
          }
        }

        return res.status(400).json({ ok: false, error: String(err.message || err) });
      }
    } catch (error) {
      console.error('Check connection error:', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to test connection' });
    }
  });

  // Debug endpoint to check current session
  app.get("/api/debug/session", async (req, res) => {
    console.log("🔍 Session debug request:");
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("Headers:", req.headers);
    console.log("Cookies:", req.headers.cookie);
    
    res.json({
      sessionId: req.sessionID,
      session: req.session,
      userId: req.session?.userId,
      username: req.session?.username,
      role: req.session?.role,
      isAuthenticated: !!req.session?.userId,
      cookies: req.headers.cookie,
      userAgent: req.headers['user-agent']
    });
  });


  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    console.log("🔐 Login attempt:", { username, hasPassword: !!password });
    console.log("Session before login:", req.session);
    console.log("Session ID before login:", req.sessionID);
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await storage.verifyPassword(username, password);
    
    if (!user) {
      console.log("❌ Login failed for user:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    console.log("✅ Login successful for user:", username, "Role:", user.role);
    
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    console.log("Session after login:", req.session);
    console.log("Session ID after login:", req.sessionID);
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email,
        passwordChangeRequired: user.passwordChangeRequired
      } 
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedUser = insertUserSchema.parse({
        ...req.body,
        role: "client" // Force new users to be clients
      });
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedUser.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedUser);
      
      // Create corresponding customer record
      const customerData = {
        userId: user.id,
        firstName: req.body.firstName || user.username,
        lastName: req.body.lastName || "",
        email: user.email || "",
        phone: req.body.phone || null,
        address: req.body.address || null,
        city: req.body.city || null,
        state: req.body.state || null,
        zipCode: req.body.zipCode || null,
        country: req.body.country || null,
      };
      
      console.log("Creating customer for user:", user.username, "with data:", customerData);
      const customer = await storage.createCustomer(customerData);
      console.log("Customer created successfully:", customer.id);
      
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      
      res.status(201).json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email 
        } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // Verify current password
  const userId = req.session.userId as string | undefined;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const isValidPassword = await storage.verifyPassword(user.username, currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Update password and clear password change requirement
  const userId2 = req.session.userId as string | undefined;
  if (!userId2) return res.status(401).json({ error: "Not authenticated" });
  const success = await storage.changeUserPassword(userId2, newPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      // Clear password change requirement
  await storage.updateUser(userId2, { passwordChangeRequired: 0 as any });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("🔍 /api/auth/me request:");
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("Session userId:", req.session?.userId);
    console.log("Cookies:", req.headers.cookie);
    
    if (!req.session.userId) {
      console.log("❌ No userId in session");
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("❌ User not found in database:", req.session.userId);
        return res.status(401).json({ error: "User not found" });
      }
      
      console.log("✅ User found:", user.username, "Role:", user.role);
      
      res.json({ 
        user: { 
          id: user.id,
          username: user.username, 
          role: user.role,
          email: user.email,
          theme: user.theme || 'original'
        } 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.email) {
        return res.status(400).json({ error: "No email address associated with this account" });
      }
      
      // Generate verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      // Clean up any existing verification codes for this user
      await storage.cleanupExpiredVerificationCodes();
      
      // Create new verification code
      const verificationCode = await storage.createVerificationCode({
        userId: user.id,
        code,
        type: "password_reset",
        expiresAt,
        used: 0
      });
      
      // Send email
      const emailHtml = createPasswordResetEmail(code, user.username);
      const emailSent = await sendEmail({
        to: user.email,
        subject: "Password Reset - BeatBazaar",
        html: emailHtml
      });
      
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send verification email" });
      }
      
      res.json({ 
        message: "Verification code sent to your email address",
        userId: user.id // Send userId for verification step
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({ error: "User ID and verification code are required" });
      }
      
      // Verify the code
      const verificationCode = await storage.getVerificationCode(userId, code, "password_reset");
      
      if (!verificationCode) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }
      
      // Mark code as used
      await storage.markVerificationCodeAsUsed(verificationCode.id);
      
      res.json({ 
        message: "Verification code is valid",
        verified: true
      });
      
    } catch (error) {
      console.error("Verify reset code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { userId, code, newPassword } = req.body;
      
      if (!userId || !code || !newPassword) {
        return res.status(400).json({ error: "User ID, verification code, and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Verify the code one more time
      const verificationCode = await storage.getVerificationCode(userId, code, "password_reset");
      
      if (!verificationCode) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }
      
      // Update password
      const success = await storage.changeUserPassword(userId, newPassword);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      // Mark code as used
      await storage.markVerificationCodeAsUsed(verificationCode.id);
      
      res.json({ 
        message: "Password updated successfully" 
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Email test endpoint (admin only)
  app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
    try {
      const { testEmail, emailSettings } = req.body;
      
      if (!testEmail || !emailSettings) {
        return res.status(400).json({ error: "Test email and email settings are required" });
      }
      
      // Create a temporary transporter with the provided settings
      const testTransporter = nodemailer.createTransport({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        secure: emailSettings.smtpSecure,
        auth: {
          user: emailSettings.smtpUser,
          pass: emailSettings.smtpPass
        }
      });
      
      // Verify connection
      await testTransporter.verify();
      
      // Send test email
      const testEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>BeatBazaar Email Test</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎵 BeatBazaar</div>
              <h1>Email Configuration Test</h1>
            </div>
            
            <div class="success">
              <strong>✅ Success!</strong> Your email configuration is working correctly.
            </div>
            
            <p>This is a test email sent from BeatBazaar to verify that your SMTP settings are configured properly.</p>
            
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>SMTP Host: ${emailSettings.smtpHost}</li>
              <li>SMTP Port: ${emailSettings.smtpPort}</li>
              <li>From Name: ${emailSettings.fromName}</li>
              <li>From Email: ${emailSettings.fromEmail}</li>
              <li>SSL/TLS: ${emailSettings.smtpSecure ? 'Enabled' : 'Disabled'}</li>
            </ul>
            
            <p>You can now use the password reset functionality and other email features in BeatBazaar.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; text-align: center;">
              <p>This is an automated test message from BeatBazaar.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const info = await testTransporter.sendMail({
        from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
        to: testEmail,
        subject: "BeatBazaar Email Configuration Test",
        html: testEmailHtml
      });
      
      res.json({ 
        message: "Test email sent successfully",
        messageId: info.messageId
      });
      
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ 
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Email settings endpoints (admin only)
  app.get("/api/admin/email-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings || {
        enabled: false,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPass: '',
        fromName: 'BeatBazaar',
        fromEmail: ''
      });
    } catch (error) {
      console.error("Get email settings error:", error);
      res.status(500).json({ error: "Failed to get email settings" });
    }
  });

  app.put("/api/admin/email-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateEmailSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update email settings error:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  // Social media settings endpoints
  app.get("/api/social-media-settings", async (req, res) => {
    try {
      const settings = await storage.getSocialMediaSettings();
      res.json(settings || {
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        youtubeUrl: '',
        tiktokUrl: ''
      });
    } catch (error) {
      console.error("Get social media settings error:", error);
      res.status(500).json({ error: "Failed to get social media settings" });
    }
  });

  app.put("/api/admin/social-media-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateSocialMediaSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update social media settings error:", error);
      res.status(500).json({ error: "Failed to update social media settings" });
    }
  });

// Contact settings routes
app.get("/api/contact-settings", async (req, res) => {
  try {
    const settings = await storage.getContactSettings();
    res.json(settings || {
      bandImageUrl: '',
      bandName: 'BeatBazaar',
      contactEmail: 'contact@beatbazaar.com',
      contactPhone: '+1 (555) 123-4567',
      contactAddress: '123 Music Street',
      contactCity: 'Los Angeles',
      contactState: 'CA',
      contactZipCode: '90210',
      contactCountry: 'USA',
      messageEnabled: true,
      messageSubject: 'New Contact Form Submission',
      messageTemplate: 'You have received a new message from your contact form.'
    });
  } catch (error) {
    console.error("Get contact settings error:", error);
    res.status(500).json({ error: "Failed to get contact settings" });
  }
});

app.put("/api/admin/contact-settings", requireAdmin, async (req, res) => {
  try {
    const settings = await storage.updateContactSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error("Update contact settings error:", error);
    res.status(500).json({ error: "Failed to update contact settings" });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Get contact settings to check if messaging is enabled
    const contactSettings = await storage.getContactSettings();
    
    if (!contactSettings?.messageEnabled) {
      return res.status(400).json({ error: "Contact form is currently disabled" });
    }

    // Here you would typically send an email or save to database
    // For now, we'll just log the contact form submission
    console.log("Contact form submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
      settings: contactSettings
    });

    res.json({ message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

// Artist bio routes
app.get("/api/artist-bios", async (req, res) => {
  try {
    const bios = await storage.getArtistBios();
    res.json(bios);
  } catch (error) {
    console.error("Get artist bios error:", error);
    res.status(500).json({ error: "Failed to get artist bios" });
  }
});

app.get("/api/artist-bios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bio = await storage.getArtistBio(id);
    
    if (!bio) {
      return res.status(404).json({ error: "Artist bio not found" });
    }
    
    res.json(bio);
  } catch (error) {
    console.error("Get artist bio error:", error);
    res.status(500).json({ error: "Failed to get artist bio" });
  }
});

app.post("/api/admin/artist-bios", requireAdmin, async (req, res) => {
  try {
    const bio = await storage.createArtistBio(req.body);
    res.json(bio);
  } catch (error) {
    console.error("Create artist bio error:", error);
    res.status(500).json({ error: "Failed to create artist bio" });
  }
});

app.put("/api/admin/artist-bios/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bio = await storage.updateArtistBio(id, req.body);
    res.json(bio);
  } catch (error) {
    console.error("Update artist bio error:", error);
    res.status(500).json({ error: "Failed to update artist bio" });
  }
});

app.delete("/api/admin/artist-bios/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteArtistBio(id);
    res.json({ message: "Artist bio deleted successfully" });
  } catch (error) {
    console.error("Delete artist bio error:", error);
    res.status(500).json({ error: "Failed to delete artist bio" });
  }
});

  // Theme endpoints
  app.put("/api/auth/theme", requireAuth, async (req, res) => {
    try {
      const { theme } = req.body;
      const userId = ensureUserId(req, res);
      if (!userId) return;
      
      if (!theme) {
        return res.status(400).json({ error: "Theme is required" });
      }
      
      const validThemes = ['original', 'default', 'card-match', 'black-white', 'red-black', 'blue-purple', 'green-dark', 'orange-dark', 'pink-purple', 'cyan-dark'];
      if (!validThemes.includes(theme)) {
        return res.status(400).json({ error: "Invalid theme" });
      }
      
      const success = await storage.updateUserTheme(userId, theme);
      if (!success) {
        return res.status(500).json({ error: "Failed to update theme" });
      }
      
      res.json({ message: "Theme updated successfully", theme });
    } catch (error) {
      console.error("Theme update error:", error);
      res.status(500).json({ error: "Failed to update theme" });
    }
  });

  // Password change endpoint (admin only)
  app.put("/api/users/:userId/password", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const success = await storage.changeUserPassword(userId, newPassword);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Beat routes
  app.get("/api/beats", async (req, res) => {
    try {
      const genreFilter = req.query.genre as string | undefined;
      
      if (genreFilter) {
        // Filter by genre if provided
        const beats = await storage.getBeatsByGenre(genreFilter);
        res.json(beats);
      } else {
        // Return all beats if no filter
        const beats = await storage.getAllBeats();
        res.json(beats);
      }
    } catch (error) {
      console.error("Get beats error:", error);
      res.status(500).json({ error: "Failed to fetch beats" });
    }
  });

  app.get("/api/beats/latest/:limit", async (req, res) => {
    const limit = parseInt(req.params.limit) || 6;
    const beats = await storage.getLatestBeats(limit);
    res.json(beats);
  });

  app.get("/api/beats/:id", async (req, res) => {
    const beat = await storage.getBeat(req.params.id);
    if (!beat) {
      return res.status(404).json({ error: "Beat not found" });
    }
    res.json(beat);
  });

  app.post("/api/beats", requireAdmin, upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      // Get file URLs
      const audioUrl = files?.audio?.[0] ? `/uploads/audio/${files.audio[0].filename}` : undefined;
      const imageUrl = files?.image?.[0] ? `/uploads/images/${files.image[0].filename}` : 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=No+Image';

      // Create beat data with file URLs
      const beatData = {
        ...req.body,
        audioUrl,
        imageUrl,
        bpm: parseInt(req.body.bpm) || 0,
        price: parseFloat(req.body.price) || 0
      };

      const validatedBeat = insertBeatSchema.parse(beatData);
      const beat = await storage.createBeat(validatedBeat);
      res.status(201).json(beat);
    } catch (error) {
      console.error('Beat creation error:', error);
      res.status(400).json({ error: "Invalid beat data" });
    }
  });

  app.put("/api/beats/:id", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      // Convert numeric fields from strings (FormData sends everything as strings)
      if (updateData.bpm) updateData.bpm = parseInt(updateData.bpm);
      if (updateData.price) updateData.price = parseFloat(updateData.price);
      
      // If a new image was uploaded, update the imageUrl
      if (req.file) {
        updateData.imageUrl = `/uploads/images/${req.file.filename}`;
      } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
        // If an image URL was provided, use it
        updateData.imageUrl = req.body.imageUrl.trim();
      }
      
      console.log('Updating beat with data:', updateData);
      
      const beat = await storage.updateBeat(req.params.id, updateData);
      if (!beat) {
        return res.status(404).json({ error: "Beat not found" });
      }
      res.json(beat);
    } catch (error) {
      console.error('Beat update error:', error);
      res.status(400).json({ error: "Invalid beat data" });
    }
  });

  app.delete("/api/beats/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteBeat(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Beat not found" });
    }
    res.status(204).send();
  });

  // Purchase routes
  app.get("/api/purchases", requireAdmin, async (req, res) => {
    const purchases = await storage.getAllPurchases();
    res.json(purchases);
  });

  app.get("/api/purchases/user/:userId", requireAuth, async (req, res) => {
    // Users can only see their own purchases
    const sessionUserId = ensureUserId(req, res);
    if (!sessionUserId) return;
    if (req.session.role !== 'admin' && req.params.userId !== sessionUserId) {
      return res.status(403).json({ error: "Access denied" });
    }
    const purchases = await storage.getPurchasesByUser(req.params.userId);
    res.json(purchases);
  });

  app.get("/api/purchases/my", requireAuth, async (req, res) => {
    const uid = ensureUserId(req, res);
    if (!uid) return;
    console.log('GET /api/purchases/my - Session userId:', uid);
    const purchases = await storage.getPurchasesByUser(uid);
    console.log('GET /api/purchases/my - Found purchases:', purchases.length);
    res.json(purchases);
  });

  // Get user's playlist (purchased beats with full details)
  app.get("/api/playlist", requireAuth, async (req, res) => {
    try {
      const uid = ensureUserId(req, res);
      if (!uid) return;
      console.log('GET /api/playlist - Session userId:', uid);
      const playlist = await storage.getUserPlaylist(uid);
      console.log('GET /api/playlist - Found playlist items:', playlist.length);
      res.json(playlist);
    } catch (error) {
      console.error("Get playlist error:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  app.post("/api/purchases", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as string | undefined;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const validatedPurchase = insertPurchaseSchema.parse({
        ...req.body,
        userId // Force user to be the authenticated user
      });

      // Check if user already owns this beat (requires completed payment)
      const alreadyOwns = await storage.userOwnsBeat(userId, validatedPurchase.beatId);
      if (alreadyOwns) {
        return res.status(400).json({ error: "You already own this beat" });
      }

      // Create a purchase record now; payment flow should mark payment completed
      const purchase = await storage.createPurchase(validatedPurchase);

      // IMPORTANT: purchases alone do not grant access until an associated payment is completed.
      // Increment download count only after a successful payment (handled by payment flow/webhook).

      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", requireAdmin, async (req, res) => {
    const analytics = await storage.getAnalytics();
    console.log('Analytics API returning:', analytics);
    res.json(analytics);
  });

  app.post("/api/analytics/visit", async (req, res) => {
    await storage.incrementSiteVisits();
    console.log('Site visit incremented');
    res.status(204).send();
  });

  app.post("/api/analytics/download", requireAuth, async (req, res) => {
    await storage.incrementDownloads();
    res.status(204).send();
  });

  // Customer routes
  app.get("/api/customers", requireAdmin, async (req, res) => {
    try {
      const allCustomers = await storage.getAllCustomers();
      console.log("All customers found:", allCustomers.length, allCustomers);
      
      // Filter out admin users - only show client users as customers
      const clientCustomers = await storage.getCustomersByRole('client');
      console.log("Client customers found:", clientCustomers.length, clientCustomers);
      
      res.json(clientCustomers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/by-user/:userId", requireAuth, async (req, res) => {
    try {
      console.log("Looking up customer for user ID:", req.params.userId);
      const customer = await storage.getCustomerByUserId(req.params.userId);
      console.log("Customer found:", customer);
      if (!customer) {
        console.log("No customer found for user ID:", req.params.userId);
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Get customer by user ID error:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/:id", requireAdmin, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/:id/purchases", requireAdmin, async (req, res) => {
    try {
      const purchases = await storage.getPurchasesByUser(req.params.id);
      res.json(purchases);
    } catch (error) {
      console.error("Get customer purchases error:", error);
      res.status(500).json({ error: "Failed to fetch customer purchases" });
    }
  });

  // User Management endpoints
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Only show admin users in user management
      const adminUsers = allUsers.filter(user => user.role === 'admin');
      res.json(adminUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const userData = {
        username,
        email,
        password,
        role: 'admin' // Force admin role for user management
      };
      
      const user = await storage.createUser(userData);
      
      // Create corresponding customer record
      const customerData = {
        userId: user.id,
        firstName: username,
        lastName: "",
        email: email || "",
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
      };
      
      await storage.createCustomer(customerData);
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, password, role } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updateData: any = { username, email, role };
      
      // Only update password if provided
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(id, updateData);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't allow deleting the current admin user
      const currentAdminId = ensureUserId(req, res);
      if (!currentAdminId) return;
      if (id === currentAdminId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(400).json({ error: "Failed to delete user" });
    }
  });

  // Database reset endpoint removed for safety. Manual reset operations
  // should be performed directly on the server by a developer/ops person.

  // Migration endpoint to create customer records for users without them
  app.post("/api/admin/migrate-customers", requireAdmin, async (req, res) => {
    try {
      console.log("Starting customer migration...");
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      console.log("All users found:", allUsers.length);
      
      // Get all existing customers
      const existingCustomers = await storage.getAllCustomers();
      console.log("Existing customers:", existingCustomers.length);
      
      const usersWithoutCustomers = allUsers.filter(user => 
        !existingCustomers.some(customer => customer.userId === user.id)
      );
      
      console.log("Users without customers:", usersWithoutCustomers.length);
      
      let createdCount = 0;
      for (const user of usersWithoutCustomers) {
        try {
          const customerData = {
            userId: user.id,
            firstName: user.username,
            lastName: "",
            email: user.email || "",
            phone: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            country: null,
          };
          
          await storage.createCustomer(customerData);
          createdCount++;
          console.log(`Created customer for user: ${user.username}`);
        } catch (error) {
          console.error(`Failed to create customer for user ${user.username}:`, error);
        }
      }
      
      console.log(`Migration completed. Created ${createdCount} customer records.`);
      res.json({ 
        message: `Migration completed successfully. Created ${createdCount} customer records.`,
        createdCount,
        totalUsers: allUsers.length,
        existingCustomers: existingCustomers.length
      });
    } catch (error) {
      console.error("Customer migration error:", error);
      res.status(500).json({ error: "Failed to migrate customers" });
    }
  });

  // Cart routes
  app.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const uid = ensureUserId(req, res);
      if (!uid) return;
      console.log("GET /api/cart - userId:", uid);
      const cart = await storage.getUserCart(uid);
      console.log("GET /api/cart - returning:", cart.length, "items");
      res.json(cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", requireAuth, async (req, res) => {
    try {
      const { beatId } = req.body;
      const uid = ensureUserId(req, res);
      if (!uid) return;
      console.log("POST /api/cart/add - userId:", uid, "beatId:", beatId);
      if (!beatId) {
        return res.status(400).json({ error: "Beat ID is required" });
      }
      
      // Check if user already owns this beat
      const existingPurchase = await storage.getPurchaseByUserAndBeat(uid, beatId);
      if (existingPurchase) {
        return res.status(400).json({ error: "You already own this beat" });
      }
      
      const cart = await storage.addToCart(uid, beatId);
      console.log("POST /api/cart/add - returning:", cart.length, "items");
      res.json(cart);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.delete("/api/cart/remove/:beatId", requireAuth, async (req, res) => {
    try {
      const { beatId } = req.params;
      const uid = ensureUserId(req, res);
      if (!uid) return;
      const cart = await storage.removeFromCart(uid, beatId);
      res.json(cart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart/clear", requireAuth, async (req, res) => {
    try {
      const uid = ensureUserId(req, res);
      if (!uid) return;
      await storage.clearCart(uid);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Payment routes
  // Create a Stripe payment intent for a beat purchase
  app.post('/api/stripe/create-payment-intent', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as string | undefined;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const { beatId } = req.body;
      if (!beatId) return res.status(400).json({ error: 'beatId is required' });

      const beat = await storage.getBeat(beatId);
      if (!beat) return res.status(404).json({ error: 'Beat not found' });

      // Get or create customer record for this user
      let customer = await storage.getCustomerByUserId(userId);
      if (!customer) {
        const user = await storage.getUser(userId);
        const customerData = {
          userId,
          firstName: user?.username || 'Customer',
          lastName: '',
          email: user?.email || '',
        };
        customer = await storage.createCustomer(customerData);
      }

      // Create a purchase record (does NOT grant access until payment completes)
      const purchase = await storage.createPurchase({
        userId,
        beatId,
        price: beat.price
      });

      // Create a payment record in pending state
      const payment = await storage.createPayment({
        purchaseId: purchase.id,
        customerId: customer.id,
        amount: beat.price,
        paymentMethod: 'stripe',
        status: 'pending'
      });

      // Create Stripe payment intent
  const stripeMod = await import('./stripe');
  const { createPaymentIntent } = stripeMod as any;
  const stripePaymentIntent = await createPaymentIntent(beat.price, 'usd', customer, beat, { paymentId: payment.id, purchaseId: purchase.id });
      if (!stripePaymentIntent) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      // Record stripe transaction
      await storage.createStripeTransaction({
        id: randomUUID(),
        paymentId: payment.id,
        stripePaymentIntentId: stripePaymentIntent.id as string,
        stripeCustomerId: stripePaymentIntent.customer as string | undefined,
        amount: beat.price,
        currency: 'usd',
        status: 'pending'
      });

      res.json({ clientSecret: stripePaymentIntent.client_secret, paymentIntentId: stripePaymentIntent.id });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Stripe webhook handler (use raw body)
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string | undefined;
  const stripeMod = await import('./stripe');
  const { constructWebhookEvent } = stripeMod as any;
  const event = await constructWebhookEvent(req.body, sig || '');
      if (!event) return res.status(400).send('Webhook configuration error');

      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object as any;
        const paymentIntentId = pi.id;

        const tx = await storage.getStripeTransactionByPaymentIntent(paymentIntentId);
        if (!tx) {
          console.warn('Stripe transaction not found for payment intent:', paymentIntentId);
          return res.json({ received: true });
        }

        // update stripe transaction
        await storage.updateStripeTransaction(tx.id, { status: 'succeeded' });

        // update payment status to completed
        await storage.updatePaymentStatus(tx.paymentId, 'completed');

        console.log('Payment intent succeeded, marked payment completed for paymentId:', tx.paymentId);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).send(`Webhook error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  app.get("/api/payments", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getPaymentsWithDetails();
      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/status/:status", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByStatus(req.params.status);
      res.json(payments);
    } catch (error) {
      console.error("Get payments by status error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments/:id/approve", requireAdmin, async (req, res) => {
    try {
      console.log("Payment approval request - ID:", req.params.id, "Body:", req.body);
      const { approvedBy } = req.body;
      console.log("Approved by:", approvedBy);
      
      const payment = await storage.updatePaymentStatus(req.params.id, "approved", approvedBy);
      console.log("Update payment status result:", payment);
      
      if (!payment) {
        console.log("Payment not found for ID:", req.params.id);
        return res.status(404).json({ error: "Payment not found" });
      }
      
      console.log("Payment approved successfully:", payment);
      res.json(payment);
    } catch (error) {
      console.error("Approve payment error:", error);
      res.status(500).json({ error: "Failed to approve payment" });
    }
  });

  app.post("/api/payments/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { approvedBy } = req.body;
      const payment = await storage.updatePaymentStatus(req.params.id, "rejected", approvedBy);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Reject payment error:", error);
      res.status(500).json({ error: "Failed to reject payment" });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const { purchaseId, customerId, amount, paymentMethod, bankReference, notes } = req.body;
      
      const uid = ensureUserId(req, res);
      if (!uid) return;

      console.log("Creating payment:", { purchaseId, customerId, amount, paymentMethod, bankReference, notes });
      
      // Check if customer exists, if not create one
      let finalCustomerId = customerId;
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        console.log("Customer verification - customerId:", customerId, "customer found:", customer);
        
        if (!customer) {
          console.log("Customer not found, creating new customer for user ID:", uid);
          // Create a customer record for this user
          const customerData = {
            userId: uid,
            firstName: "Customer",
            lastName: "User",
            email: "",
            phone: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            country: null,
          };
          const newCustomer = await storage.createCustomer(customerData);
          finalCustomerId = newCustomer.id;
          console.log("Created new customer with ID:", finalCustomerId);
        }
      }
      
      const paymentData = {
        purchaseId,
        customerId: finalCustomerId,
        amount: amount.toString(),
        paymentMethod,
        bankReference,
        notes,
        status: paymentMethod === 'bank_transfer' ? 'pending' : 'completed'
      };

      console.log("Payment data:", paymentData);

      const payment = await storage.createPayment(paymentData);
      console.log("Payment created:", payment);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Create payment error:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Database reset endpoint removed for safety. Manual reset operations
  // should be performed directly on the server by a developer/ops person.

  // Genre management routes
  
  // Get beats by genre with optional limit (must come before /api/genres to avoid route conflict)
  app.get("/api/genres/:genreId/beats", async (req, res) => {
    try {
      const { genreId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const beats = await storage.getBeatsByGenre(genreId, limit);
      res.json(beats);
    } catch (error) {
      console.error("Get beats by genre error:", error);
      res.status(500).json({ error: "Failed to fetch beats" });
    }
  });

  // Get single genre by ID (must come before /api/genres to avoid route conflict)
  app.get("/api/genres/:genreId", async (req, res) => {
    try {
      const { genreId } = req.params;
      const genre = await storage.getGenre(genreId);
      if (!genre) {
        return res.status(404).json({ error: "Genre not found" });
      }
      res.json(genre);
    } catch (error) {
      console.error("Get genre error:", error);
      res.status(500).json({ error: "Failed to fetch genre" });
    }
  });

  // Get all active genres with their beats (limited per genre)
  app.get("/api/genres-with-beats", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const genresWithBeats = await storage.getActiveGenresWithBeats(limit);
      res.json(genresWithBeats);
    } catch (error) {
      console.error("Get genres with beats error:", error);
      res.status(500).json({ error: "Failed to fetch genres with beats" });
    }
  });

  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getActiveGenres();
      res.json(genres);
    } catch (error) {
      console.error("Get genres error:", error);
      res.status(500).json({ error: "Failed to fetch genres" });
    }
  });

  app.get("/api/admin/genres", requireAdmin, async (req, res) => {
    try {
      const genres = await storage.getAllGenres();
      res.json(genres);
    } catch (error) {
      console.error("Get all genres error:", error);
      res.status(500).json({ error: "Failed to fetch genres" });
    }
  });

  app.post("/api/admin/genres", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=No+Image';
      
      const genreData = {
        ...req.body,
        imageUrl,
        isActive: req.body.isActive === 'true'
      };

      const genre = await storage.createGenre(genreData);
      res.status(201).json(genre);
    } catch (error) {
      console.error('Genre creation error:', error);
      res.status(400).json({ error: "Invalid genre data" });
    }
  });

  app.put("/api/admin/genres/:id", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      if (req.file) {
        updateData.imageUrl = `/uploads/images/${req.file.filename}`;
      }
      
      if (updateData.isActive !== undefined) {
        updateData.isActive = updateData.isActive === 'true';
      }

      const genre = await storage.updateGenre(req.params.id, updateData);
      if (!genre) {
        return res.status(404).json({ error: "Genre not found" });
      }
      res.json(genre);
    } catch (error) {
      console.error('Genre update error:', error);
      res.status(400).json({ error: "Invalid genre data" });
    }
  });

  app.delete("/api/admin/genres/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteGenre(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Genre not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Genre deletion error:', error);
      res.status(500).json({ error: "Failed to delete genre" });
    }
  });

  // Plans settings routes
  app.get("/api/plans-settings", async (req, res) => {
    try {
      const settings = await storage.getPlansSettings();
      console.log('📋 Plans settings from DB:', settings);
      
      if (!settings) {
        console.log('⚠️ No plans settings found in database, returning defaults');
        // Return default settings if none exist
        return res.json({
          pageTitle: "Beat Licensing Plans",
          pageSubtitle: "Choose the perfect licensing plan for your music project",
          basicPlan: {
            name: "Basic License",
            price: 29,
            description: "Perfect for independent artists",
            features: ["Commercial use rights", "Up to 5,000 copies", "Streaming on all platforms"],
            isActive: true
          },
          premiumPlan: {
            name: "Premium License",
            price: 99,
            description: "Ideal for established artists",
            features: ["Everything in Basic", "Up to 50,000 copies", "TV and film rights"],
            isActive: true,
            isPopular: true
          },
          exclusivePlan: {
            name: "Exclusive Rights",
            price: 999,
            description: "Complete ownership",
            features: ["Complete ownership", "Unlimited use", "Master recording ownership"],
            isActive: true
          },
          additionalFeaturesTitle: "Why Choose Us?",
          additionalFeatures: [],
          faqSection: { title: "FAQ", questions: [] },
          trustBadges: []
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get plans settings error:", error);
      res.status(500).json({ error: "Failed to get plans settings" });
    }
  });

  app.put("/api/admin/plans-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updatePlansSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update plans settings error:", error);
      res.status(500).json({ error: "Failed to update plans settings" });
    }
  });

  // App branding settings routes
  app.get("/api/app-branding-settings", async (req, res) => {
    try {
      const settings = await storage.getAppBrandingSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get app branding settings error:", error);
      res.status(500).json({ error: "Failed to get app branding settings" });
    }
  });

  app.put("/api/admin/app-branding-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateAppBrandingSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update app branding settings error:", error);
      res.status(500).json({ error: "Failed to update app branding settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
