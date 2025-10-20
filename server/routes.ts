import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBeatSchema, insertPurchaseSchema, insertUserSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

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
      const userId = req.session.userId;

      // Check if user has purchased this beat
      const purchase = await storage.getPurchaseByUserAndBeat(userId, beatId);
      if (!purchase) {
        return res.status(403).json({ error: 'You have not purchased this song' });
      }

      // Get beat details
      const beat = await storage.getBeatById(beatId);
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
      res.status(500).json({ error: error.message });
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
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const isValidPassword = await storage.verifyPassword(user.username, currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Update password and clear password change requirement
      const success = await storage.changeUserPassword(req.session.userId, newPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      // Clear password change requirement
      await storage.updateUser(req.session.userId, { passwordChangeRequired: false });
      
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

  // Theme endpoints
  app.put("/api/auth/theme", requireAuth, async (req, res) => {
    try {
      const { theme } = req.body;
      const userId = req.session.userId;
      
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
    const beats = await storage.getAllBeats();
    res.json(beats);
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

  app.put("/api/beats/:id", requireAdmin, async (req, res) => {
    try {
      const beat = await storage.updateBeat(req.params.id, req.body);
      if (!beat) {
        return res.status(404).json({ error: "Beat not found" });
      }
      res.json(beat);
    } catch (error) {
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
    if (req.session.role !== 'admin' && req.params.userId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    const purchases = await storage.getPurchasesByUser(req.params.userId);
    res.json(purchases);
  });

  app.get("/api/purchases/my", requireAuth, async (req, res) => {
    console.log('GET /api/purchases/my - Session userId:', req.session.userId);
    const purchases = await storage.getPurchasesByUser(req.session.userId);
    console.log('GET /api/purchases/my - Found purchases:', purchases.length);
    res.json(purchases);
  });

  // Get user's playlist (purchased beats with full details)
  app.get("/api/playlist", requireAuth, async (req, res) => {
    try {
      console.log('GET /api/playlist - Session userId:', req.session.userId);
      const playlist = await storage.getUserPlaylist(req.session.userId);
      console.log('GET /api/playlist - Found playlist items:', playlist.length);
      res.json(playlist);
    } catch (error) {
      console.error("Get playlist error:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  app.post("/api/purchases", requireAuth, async (req, res) => {
    try {
      const validatedPurchase = insertPurchaseSchema.parse({
        ...req.body,
        userId: req.session.userId // Force user to be the authenticated user
      });
      
      // Check if user already owns this beat
      const existingPurchase = await storage.getPurchaseByUserAndBeat(req.session.userId, validatedPurchase.beatId);
      if (existingPurchase) {
        return res.status(400).json({ error: "You already own this beat" });
      }
      
      const purchase = await storage.createPurchase(validatedPurchase);
      
      // Increment download count
      await storage.incrementDownloads();
      
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
      if (id === req.session.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(400).json({ error: "Failed to delete user" });
    }
  });

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
      console.log("GET /api/cart - userId:", req.session.userId);
      const cart = await storage.getUserCart(req.session.userId);
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
      console.log("POST /api/cart/add - userId:", req.session.userId, "beatId:", beatId);
      if (!beatId) {
        return res.status(400).json({ error: "Beat ID is required" });
      }
      
      // Check if user already owns this beat
      const existingPurchase = await storage.getPurchaseByUserAndBeat(req.session.userId, beatId);
      if (existingPurchase) {
        return res.status(400).json({ error: "You already own this beat" });
      }
      
      const cart = await storage.addToCart(req.session.userId, beatId);
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
      const cart = await storage.removeFromCart(req.session.userId, beatId);
      res.json(cart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart/clear", requireAuth, async (req, res) => {
    try {
      await storage.clearCart(req.session.userId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Payment routes
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
      
      console.log("Creating payment:", { purchaseId, customerId, amount, paymentMethod, bankReference, notes });
      
      // Check if customer exists, if not create one
      let finalCustomerId = customerId;
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        console.log("Customer verification - customerId:", customerId, "customer found:", customer);
        
        if (!customer) {
          console.log("Customer not found, creating new customer for user ID:", req.session.userId);
          // Create a customer record for this user
          const customerData = {
            userId: req.session.userId,
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

  // Database reset endpoint (admin only)
  app.post("/api/admin/reset-database", requireAdmin, async (req, res) => {
    try {
      console.log("Resetting database...");
      await storage.resetDatabase();
      console.log("Database reset completed");
      
      // Destroy the current session to force logout
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session after reset:", err);
        }
      });
      
      res.json({ 
        message: "Database reset successfully. Please log in with admin credentials.",
        redirectToLogin: true
      });
    } catch (error) {
      console.error("Database reset error:", error);
      res.status(500).json({ error: "Failed to reset database" });
    }
  });

  // Genre management routes
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

  const httpServer = createServer(app);

  return httpServer;
}
