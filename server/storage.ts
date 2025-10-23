import path from "path";
import fs from "fs";
import { 
  type User, 
  type InsertUser,
  type Beat,
  type InsertBeat,
  type Purchase,
  type InsertPurchase,
  type Analytics,
  type InsertAnalytics,
  type Customer,
  type InsertCustomer,
  type Cart,
  type InsertCart,
  type Payment,
  type InsertPayment,
  type Genre,
  type InsertGenre,
  type VerificationCode,
  type InsertVerificationCode,
  type EmailSettings,
  type InsertEmailSettings,
  type SocialMediaSettings,
  type InsertSocialMediaSettings,
  type ContactSettings,
  type InsertContactSettings,
  type ArtistBio,
  type InsertArtistBio,
  type PlansSettings,
  type InsertPlansSettings,
  type AppBrandingSettings,
  type InsertAppBrandingSettings,
  users,
  beats,
  purchases,
  analytics,
  customers,
  cart,
  payments,
  genres,
  verificationCodes,
  emailSettings,
  socialMediaSettings,
  contactSettings,
  artistBios,
  plansSettings,
  appBrandingSettings
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import Database from "better-sqlite3";
import postgres from "postgres";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Database configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
let db: any;

if (isProduction && process.env.DATABASE_URL) {
  // Use PostgreSQL in production
  const client = postgres(process.env.DATABASE_URL);
  db = drizzlePg(client);
  console.log("✓ Using PostgreSQL database");
} else {
  // Use SQLite in development
  const sqlite = new Database("beatbazaar.db");
  db = drizzle(sqlite);
  console.log("✓ Using SQLite database");
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  verifyPassword(username: string, password: string): Promise<User | undefined>;
  changeUserPassword(userId: string, newPassword: string): Promise<boolean>;
  updateUserTheme(userId: string, theme: string): Promise<boolean>;
  
  // Beat operations
  getBeat(id: string): Promise<Beat | undefined>;
  getAllBeats(): Promise<Beat[]>;
  getLatestBeats(limit: number): Promise<Beat[]>;
  createBeat(beat: InsertBeat): Promise<Beat>;
  updateBeat(id: string, beat: Partial<InsertBeat>): Promise<Beat | undefined>;
  deleteBeat(id: string): Promise<boolean>;
  
  // Purchase operations
  getPurchase(id: string): Promise<Purchase | undefined>;
  getPurchasesByUser(userId: string): Promise<Purchase[]>;
  getAllPurchases(): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchaseByUserAndBeat(userId: string, beatId: string): Promise<Purchase | undefined>;
  
  // Analytics operations
  getAnalytics(): Promise<Analytics | undefined>;
  updateAnalytics(analytics: Partial<InsertAnalytics>): Promise<Analytics>;
  incrementSiteVisits(): Promise<void>;
  incrementDownloads(): Promise<void>;
  
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByUserId(userId: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  getCustomersByRole(role: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  getPaymentsByStatus(status: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, approvedBy?: string): Promise<Payment | undefined>;
  getPaymentsWithDetails(): Promise<any[]>;
  
  // Cart operations
  getUserCart(userId: string): Promise<Beat[]>;
  addToCart(userId: string, beatId: string): Promise<Beat[]>;
  removeFromCart(userId: string, beatId: string): Promise<Beat[]>;
  clearCart(userId: string): Promise<void>;
  
  // Playlist operations
  getUserPlaylist(userId: string): Promise<Beat[]>;
  
  // Genre operations
  getGenre(id: string): Promise<Genre | undefined>;
  getAllGenres(): Promise<Genre[]>;
  getActiveGenres(): Promise<Genre[]>;
  createGenre(genre: InsertGenre): Promise<Genre>;
  updateGenre(id: string, genre: Partial<InsertGenre>): Promise<Genre | undefined>;
  deleteGenre(id: string): Promise<boolean>;
  
  // Verification code operations
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(userId: string, code: string, type: string): Promise<VerificationCode | undefined>;
  markVerificationCodeAsUsed(id: string): Promise<boolean>;
  cleanupExpiredVerificationCodes(): Promise<void>;
  
  // Email settings operations
  getEmailSettings(): Promise<EmailSettings | undefined>;
  updateEmailSettings(settings: Partial<InsertEmailSettings>): Promise<EmailSettings>;
  
  // Social media settings operations
  getSocialMediaSettings(): Promise<SocialMediaSettings | undefined>;
  updateSocialMediaSettings(settings: Partial<InsertSocialMediaSettings>): Promise<SocialMediaSettings>;

  // Contact settings operations
  getContactSettings(): Promise<ContactSettings | undefined>;
  updateContactSettings(settings: Partial<InsertContactSettings>): Promise<ContactSettings>;
  
  // Plans settings operations
  getPlansSettings(): Promise<PlansSettings | undefined>;
  updatePlansSettings(settings: Partial<InsertPlansSettings>): Promise<PlansSettings>;

  // App branding settings operations
  getAppBrandingSettings(): Promise<AppBrandingSettings | null>;
  updateAppBrandingSettings(settings: Partial<InsertAppBrandingSettings>): Promise<AppBrandingSettings>;
  
  // Database reset operations
  resetDatabase(): Promise<void>;

  // Artist bio operations
  getArtistBios(): Promise<ArtistBio[]>;
  getArtistBio(id: string): Promise<ArtistBio | undefined>;
  createArtistBio(bio: InsertArtistBio): Promise<ArtistBio>;
  updateArtistBio(id: string, bio: Partial<InsertArtistBio>): Promise<ArtistBio>;
  deleteArtistBio(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      console.log("🚀 Starting database initialization...");
      
      // Create tables if they don't exist
      await this.createTables();

      // Check if passwordChangeRequired column exists, if not add it
      try {
        await db.run(sql`SELECT password_change_required FROM users LIMIT 1`);
        console.log("✓ passwordChangeRequired column exists");
      } catch (error) {
        console.log("⚠️ passwordChangeRequired column missing, adding it...");
        try {
          if (isProduction) {
            await db.run(sql`ALTER TABLE users ADD COLUMN password_change_required BOOLEAN DEFAULT true`);
          } else {
            await db.run(sql`ALTER TABLE users ADD COLUMN password_change_required INTEGER DEFAULT 1`);
          }
          console.log("✓ Added passwordChangeRequired column");
        } catch (alterError) {
          console.error("❌ Failed to add passwordChangeRequired column:", alterError);
        }
      }

      // Check if theme column exists, if not add it
      try {
        await db.run(sql`SELECT theme FROM users LIMIT 1`);
        console.log("✓ theme column exists");
      } catch (error) {
        console.log("⚠️ theme column missing, adding it...");
        try {
          await db.run(sql`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'original'`);
          console.log("✓ Added theme column");
        } catch (alterError) {
          console.error("❌ Failed to add theme column:", alterError);
        }
      }

      // Check if admin user exists, if not create one
      console.log("🔍 Checking for admin user...");
      const adminUser = await this.getUserByUsername("admin");
      
      if (!adminUser) {
        console.log("👤 Admin user not found, creating...");
        try {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          const adminId = randomUUID();
          
          console.log(`📝 Creating admin user with ID: ${adminId}`);
          
          if (isProduction) {
            // PostgreSQL admin user creation
            console.log("🐘 Using PostgreSQL for admin user creation");
            await db.run(sql`
              INSERT INTO users (id, username, password, role, email, password_change_required, theme, created_at, updated_at)
              VALUES (${adminId}, 'admin', ${hashedPassword}, 'admin', 'admin@beatbazaar.com', true, 'original', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
          } else {
            // SQLite admin user creation
            console.log("🗃️ Using SQLite for admin user creation");
            await db.run(sql`
              INSERT INTO users (id, username, password, role, email, password_change_required, theme, created_at, updated_at)
              VALUES (${adminId}, 'admin', ${hashedPassword}, 'admin', 'admin@beatbazaar.com', 1, 'original', datetime('now'), datetime('now'))
            `);
          }
          console.log("✅ Default admin user created: admin/admin123");
          
          // Verify the user was created
          const verifyUser = await this.getUserByUsername("admin");
          if (verifyUser) {
            console.log("✅ Admin user verification successful");
          } else {
            console.error("❌ Admin user creation failed - user not found after creation");
          }
        } catch (createError) {
          console.error("❌ Failed to create admin user:", createError);
        }
      } else {
        console.log("👤 Admin user found, verifying password...");
        // Admin user exists, but let's verify/update the password to ensure it's correct
        const testPassword = "admin123";
        const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
        
        if (!isValidPassword) {
          console.log("⚠️ Admin password is incorrect, updating...");
          try {
            const newHashedPassword = await bcrypt.hash(testPassword, 10);
            
            if (isProduction) {
              await db.run(sql`
                UPDATE users 
                SET password = ${newHashedPassword}, updated_at = CURRENT_TIMESTAMP 
                WHERE username = 'admin'
              `);
            } else {
              await db.run(sql`
                UPDATE users 
                SET password = ${newHashedPassword}, updated_at = datetime('now') 
                WHERE username = 'admin'
              `);
            }
            console.log("✅ Admin password updated: admin/admin123");
          } catch (updateError) {
            console.error("❌ Failed to update admin password:", updateError);
          }
        } else {
          console.log("✅ Admin user exists with correct password");
        }
      }

      // Check if social media columns exist in contact_settings table, if not add them
      try {
        await db.run(sql`SELECT facebook_url FROM contact_settings LIMIT 1`);
        console.log("✓ Social media columns exist in contact_settings");
      } catch (error) {
        console.log("⚠️ Social media columns missing in contact_settings, adding them...");
        try {
          await db.run(sql`ALTER TABLE contact_settings ADD COLUMN facebook_url TEXT NOT NULL DEFAULT ''`);
          await db.run(sql`ALTER TABLE contact_settings ADD COLUMN instagram_url TEXT NOT NULL DEFAULT ''`);
          await db.run(sql`ALTER TABLE contact_settings ADD COLUMN twitter_url TEXT NOT NULL DEFAULT ''`);
          await db.run(sql`ALTER TABLE contact_settings ADD COLUMN youtube_url TEXT NOT NULL DEFAULT ''`);
          await db.run(sql`ALTER TABLE contact_settings ADD COLUMN tiktok_url TEXT NOT NULL DEFAULT ''`);
          console.log("✓ Added social media columns to contact_settings");
        } catch (alterError) {
          console.error("❌ Failed to add social media columns to contact_settings:", alterError);
        }
      }

      // Initialize default genres if none exist
      await this.initializeDefaultGenres();

      console.log("Database initialized");
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  }

  private async createTables() {
    try {
      console.log("🏗️ Creating database tables...");
      if (isProduction) {
        // PostgreSQL table creation
        console.log("🐘 Creating PostgreSQL tables");
        await this.createPostgreSQLTables();
      } else {
        // SQLite table creation
        console.log("🗃️ Creating SQLite tables");
        await this.createSQLiteTables();
      }
      console.log("✅ Database tables created/verified");
    } catch (error) {
      console.error("❌ Error creating tables:", error);
      throw error;
    }
  }

  private async createSQLiteTables() {
    // Create users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client',
        email TEXT,
        password_change_required INTEGER NOT NULL DEFAULT 1,
        theme TEXT NOT NULL DEFAULT 'original',
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create beats table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS beats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        producer TEXT NOT NULL,
        bpm INTEGER NOT NULL,
        genre TEXT NOT NULL,
        price REAL NOT NULL,
        image_url TEXT NOT NULL,
        audio_url TEXT,
        created_at DATETIME
      )
    `);

    // Create purchases table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        beat_id TEXT NOT NULL,
        price REAL NOT NULL,
        purchased_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (beat_id) REFERENCES beats(id)
      )
    `);

    // Create analytics table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        site_visits INTEGER NOT NULL DEFAULT 0,
        total_downloads INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME
      )
    `);

    // Create customers table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create cart table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        beat_id TEXT NOT NULL,
        added_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (beat_id) REFERENCES beats(id)
      )
    `);

    // Create payments table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        transaction_id TEXT,
        bank_reference TEXT,
        notes TEXT,
        approved_by TEXT,
        approved_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Create genres table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS genres (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#3b82f6',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create verification codes table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'password_reset',
        expires_at DATETIME NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create email settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS email_settings (
        id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 0,
        smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
        smtp_port INTEGER NOT NULL DEFAULT 587,
        smtp_secure INTEGER NOT NULL DEFAULT 0,
        smtp_user TEXT NOT NULL DEFAULT '',
        smtp_pass TEXT NOT NULL DEFAULT '',
        from_name TEXT NOT NULL DEFAULT 'BeatBazaar',
        from_email TEXT NOT NULL DEFAULT '',
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create social media settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS social_media_settings (
        id TEXT PRIMARY KEY,
        facebook_url TEXT NOT NULL DEFAULT '',
        instagram_url TEXT NOT NULL DEFAULT '',
        twitter_url TEXT NOT NULL DEFAULT '',
        youtube_url TEXT NOT NULL DEFAULT '',
        tiktok_url TEXT NOT NULL DEFAULT '',
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create contact settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS contact_settings (
        id TEXT PRIMARY KEY,
        band_image_url TEXT NOT NULL DEFAULT '',
        band_name TEXT NOT NULL DEFAULT 'BeatBazaar',
        contact_email TEXT NOT NULL DEFAULT 'contact@beatbazaar.com',
        contact_phone TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
        contact_address TEXT NOT NULL DEFAULT '123 Music Street',
        contact_city TEXT NOT NULL DEFAULT 'Los Angeles',
        contact_state TEXT NOT NULL DEFAULT 'CA',
        contact_zip_code TEXT NOT NULL DEFAULT '90210',
        contact_country TEXT NOT NULL DEFAULT 'USA',
        message_enabled INTEGER NOT NULL DEFAULT 1,
        message_subject TEXT NOT NULL DEFAULT 'New Contact Form Submission',
        message_template TEXT NOT NULL DEFAULT 'You have received a new message from your contact form.',
        facebook_url TEXT NOT NULL DEFAULT '',
        instagram_url TEXT NOT NULL DEFAULT '',
        twitter_url TEXT NOT NULL DEFAULT '',
        youtube_url TEXT NOT NULL DEFAULT '',
        tiktok_url TEXT NOT NULL DEFAULT '',
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create artist bios table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS artist_bios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Artist',
        social_links TEXT NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create plans settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS plans_settings (
        id TEXT PRIMARY KEY,
        page_title TEXT NOT NULL DEFAULT 'Beat Licensing Plans',
        page_subtitle TEXT NOT NULL DEFAULT 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.',
        basic_plan TEXT NOT NULL DEFAULT '{"name":"Basic License","price":29,"description":"Perfect for independent artists and small projects","features":["Commercial use rights","Up to 5,000 copies","Streaming on all platforms","Radio play up to 1M listeners","Music video rights","Social media promotion","1 year license term","Email support"],"isActive":true}',
        premium_plan TEXT NOT NULL DEFAULT '{"name":"Premium License","price":99,"description":"Ideal for established artists and larger projects","features":["Everything in Basic License","Up to 50,000 copies","Radio play unlimited","TV and film synchronization","Live performance rights","Remix and adaptation rights","Priority support","3 year license term","Custom contract available"],"isActive":true,"isPopular":true}',
        exclusive_plan TEXT NOT NULL DEFAULT '{"name":"Exclusive Rights","price":999,"description":"Complete ownership and exclusive rights to the beat","features":["Complete ownership of the beat","Unlimited commercial use","Unlimited copies and streams","Full publishing rights","Master recording ownership","Exclusive to you forever","No attribution required","Priority support","Custom contract","Beat removed from store","Stems and project files included"],"isActive":true}',
        additional_features_title TEXT NOT NULL DEFAULT 'Why Choose BeatBazaar?',
        additional_features TEXT NOT NULL DEFAULT '[{"title":"Legal Protection","description":"All licenses come with legal documentation and protection","icon":"Shield"},{"title":"Artist Support","description":"Dedicated support team to help with your music career","icon":"Users"},{"title":"Instant Download","description":"Get your beats immediately after purchase","icon":"Download"},{"title":"High Quality","description":"Professional studio quality beats and stems","icon":"Headphones"}]',
        faq_section TEXT NOT NULL DEFAULT '{"title":"Frequently Asked Questions","questions":[{"question":"What''s the difference between Basic and Premium licenses?","answer":"Basic licenses are perfect for independent artists with limited distribution. Premium licenses offer higher copy limits, TV/film rights, and longer terms for established artists."},{"question":"What does "Exclusive Rights" mean?","answer":"With exclusive rights, you own the beat completely. It''s removed from our store, you get all stems and project files, and no one else can use it. You have full creative and commercial control."},{"question":"Do I need to credit the producer?","answer":"For Basic and Premium licenses, crediting is appreciated but not required. With Exclusive Rights, no attribution is needed as you own the beat completely."}]}',
        trust_badges TEXT NOT NULL DEFAULT '[{"text":"Legal Protection Included","icon":"Shield"},{"text":"Instant Download","icon":"Zap"},{"text":"24/7 Support","icon":"Users"}]',
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create app branding settings table
    console.log("🎨 Creating app branding settings table...");
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS app_branding_settings (
        id TEXT PRIMARY KEY,
        app_name TEXT NOT NULL DEFAULT 'BeatBazaar',
        app_logo TEXT NOT NULL DEFAULT '',
        hero_title TEXT NOT NULL DEFAULT 'Discover Your Sound',
        hero_subtitle TEXT NOT NULL DEFAULT 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
        hero_image TEXT NOT NULL DEFAULT '',
        hero_button_text TEXT NOT NULL DEFAULT 'Start Creating',
        hero_button_link TEXT NOT NULL DEFAULT '/beats',
        login_title TEXT NOT NULL DEFAULT 'Welcome Back',
        login_subtitle TEXT NOT NULL DEFAULT 'Sign in to your account to continue',
        login_image TEXT NOT NULL DEFAULT '',
        created_at DATETIME,
        updated_at DATETIME
      )
    `);
    console.log("✅ App branding settings table created");
  }

  private async createPostgreSQLTables() {
    try {
      console.log("📋 Creating users table...");
      // Create users table
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'client',
          email TEXT,
          password_change_required BOOLEAN NOT NULL DEFAULT true,
          theme TEXT NOT NULL DEFAULT 'original',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Users table created");

      // Create beats table
      console.log("📋 Creating beats table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS beats (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          producer TEXT NOT NULL,
          bpm INTEGER NOT NULL,
          genre TEXT NOT NULL,
          price DECIMAL NOT NULL,
          image_url TEXT NOT NULL,
          audio_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Beats table created");

      // Create purchases table
      console.log("📋 Creating purchases table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS purchases (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          beat_id TEXT NOT NULL,
          price DECIMAL NOT NULL,
          purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (beat_id) REFERENCES beats(id)
        )
      `);
      console.log("✅ Purchases table created");

      // Create analytics table
      console.log("📋 Creating analytics table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS analytics (
          id TEXT PRIMARY KEY,
          site_visits INTEGER NOT NULL DEFAULT 0,
          total_downloads INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Analytics table created");

      // Create customers table
      console.log("📋 Creating customers table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          country TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      console.log("✅ Customers table created");

      // Create cart table
      console.log("📋 Creating cart table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS cart (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          beat_id TEXT NOT NULL,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (beat_id) REFERENCES beats(id)
        )
      `);
      console.log("✅ Cart table created");

      // Create payments table
      console.log("📋 Creating payments table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          purchase_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          amount DECIMAL NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          transaction_id TEXT,
          bank_reference TEXT,
          notes TEXT,
          approved_by TEXT,
          approved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_id) REFERENCES purchases(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (approved_by) REFERENCES users(id)
        )
      `);
      console.log("✅ Payments table created");

      // Create genres table
      console.log("📋 Creating genres table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS genres (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          image_url TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#3b82f6',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Genres table created");

      // Create verification codes table
      console.log("📋 Creating verification codes table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          code TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'password_reset',
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      console.log("✅ Verification codes table created");

      // Create email settings table
      console.log("📋 Creating email settings table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS email_settings (
          id TEXT PRIMARY KEY,
          enabled BOOLEAN NOT NULL DEFAULT false,
          smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
          smtp_port INTEGER NOT NULL DEFAULT 587,
          smtp_secure BOOLEAN NOT NULL DEFAULT false,
          smtp_user TEXT NOT NULL DEFAULT '',
          smtp_pass TEXT NOT NULL DEFAULT '',
          from_name TEXT NOT NULL DEFAULT 'BeatBazaar',
          from_email TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Email settings table created");

      // Create social media settings table
      console.log("📋 Creating social media settings table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS social_media_settings (
          id TEXT PRIMARY KEY,
          facebook_url TEXT NOT NULL DEFAULT '',
          instagram_url TEXT NOT NULL DEFAULT '',
          twitter_url TEXT NOT NULL DEFAULT '',
          youtube_url TEXT NOT NULL DEFAULT '',
          tiktok_url TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Social media settings table created");

      // Create contact settings table
      console.log("📋 Creating contact settings table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS contact_settings (
          id TEXT PRIMARY KEY,
          band_image_url TEXT NOT NULL DEFAULT '',
          band_name TEXT NOT NULL DEFAULT 'BeatBazaar',
          contact_email TEXT NOT NULL DEFAULT 'contact@beatbazaar.com',
          contact_phone TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
          contact_address TEXT NOT NULL DEFAULT '123 Music Street',
          contact_city TEXT NOT NULL DEFAULT 'Los Angeles',
          contact_state TEXT NOT NULL DEFAULT 'CA',
          contact_zip_code TEXT NOT NULL DEFAULT '90210',
          contact_country TEXT NOT NULL DEFAULT 'USA',
          message_enabled BOOLEAN NOT NULL DEFAULT true,
          message_subject TEXT NOT NULL DEFAULT 'New Contact Form Submission',
          message_template TEXT NOT NULL DEFAULT 'You have received a new message from your contact form.',
          facebook_url TEXT NOT NULL DEFAULT '',
          instagram_url TEXT NOT NULL DEFAULT '',
          twitter_url TEXT NOT NULL DEFAULT '',
          youtube_url TEXT NOT NULL DEFAULT '',
          tiktok_url TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Contact settings table created");

      // Create artist bios table
      console.log("📋 Creating artist bios table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS artist_bios (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          image_url TEXT NOT NULL DEFAULT '',
          bio TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'Artist',
          social_links JSONB NOT NULL DEFAULT '{}',
          is_active BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Artist bios table created");

      // Create plans settings table
      console.log("📋 Creating plans settings table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS plans_settings (
          id TEXT PRIMARY KEY,
          page_title TEXT NOT NULL DEFAULT 'Beat Licensing Plans',
          page_subtitle TEXT NOT NULL DEFAULT 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.',
          basic_plan JSONB NOT NULL DEFAULT '{"name":"Basic License","price":29,"description":"Perfect for independent artists and small projects","features":["Commercial use rights","Up to 5,000 copies","Streaming on all platforms","Radio play up to 1M listeners","Music video rights","Social media promotion","1 year license term","Email support"],"isActive":true}',
          premium_plan JSONB NOT NULL DEFAULT '{"name":"Premium License","price":99,"description":"Ideal for established artists and larger projects","features":["Everything in Basic License","Up to 50,000 copies","Radio play unlimited","TV and film synchronization","Live performance rights","Remix and adaptation rights","Priority support","3 year license term","Custom contract available"],"isActive":true,"isPopular":true}',
          exclusive_plan JSONB NOT NULL DEFAULT '{"name":"Exclusive Rights","price":999,"description":"Complete ownership and exclusive rights to the beat","features":["Complete ownership of the beat","Unlimited commercial use","Unlimited copies and streams","Full publishing rights","Master recording ownership","Exclusive to you forever","No attribution required","Priority support","Custom contract","Beat removed from store","Stems and project files included"],"isActive":true}',
          additional_features_title TEXT NOT NULL DEFAULT 'Why Choose BeatBazaar?',
          additional_features JSONB NOT NULL DEFAULT '[{"title":"Legal Protection","description":"All licenses come with legal documentation and protection","icon":"Shield"},{"title":"Artist Support","description":"Dedicated support team to help with your music career","icon":"Users"},{"title":"Instant Download","description":"Get your beats immediately after purchase","icon":"Download"},{"title":"High Quality","description":"Professional studio quality beats and stems","icon":"Headphones"}]',
          faq_section JSONB NOT NULL DEFAULT '{"title":"Frequently Asked Questions","questions":[{"question":"What''s the difference between Basic and Premium licenses?","answer":"Basic licenses are perfect for independent artists with limited distribution. Premium licenses offer higher copy limits, TV/film rights, and longer terms for established artists."},{"question":"What does "Exclusive Rights" mean?","answer":"With exclusive rights, you own the beat completely. It''s removed from our store, you get all stems and project files, and no one else can use it. You have full creative and commercial control."},{"question":"Do I need to credit the producer?","answer":"For Basic and Premium licenses, crediting is appreciated but not required. With Exclusive Rights, no attribution is needed as you own the beat completely."}]}',
          trust_badges JSONB NOT NULL DEFAULT '[{"text":"Legal Protection Included","icon":"Shield"},{"text":"Instant Download","icon":"Zap"},{"text":"24/7 Support","icon":"Users"}]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Plans settings table created");

      // Create app branding settings table
      console.log("🎨 Creating app branding settings table...");
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS app_branding_settings (
          id TEXT PRIMARY KEY,
          app_name TEXT NOT NULL DEFAULT 'BeatBazaar',
          app_logo TEXT NOT NULL DEFAULT '',
          hero_title TEXT NOT NULL DEFAULT 'Discover Your Sound',
          hero_subtitle TEXT NOT NULL DEFAULT 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
          hero_image TEXT NOT NULL DEFAULT '',
          hero_button_text TEXT NOT NULL DEFAULT 'Start Creating',
          hero_button_link TEXT NOT NULL DEFAULT '/beats',
          login_title TEXT NOT NULL DEFAULT 'Welcome Back',
          login_subtitle TEXT NOT NULL DEFAULT 'Sign in to your account to continue',
          login_image TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ App branding settings table created");
    } catch (error) {
      console.error("❌ Error creating PostgreSQL tables:", error);
      throw error;
    }
  }

  private async initializeDefaultGenres() {
    try {
      const existingGenres = await this.getAllGenres();
      if (existingGenres.length === 0) {
        const defaultGenres = [
          { name: "Hip-Hop", description: "Classic hip-hop beats and instrumentals", color: "#ff6b6b" },
          { name: "Trap", description: "Modern trap beats with heavy bass", color: "#4ecdc4" },
          { name: "R&B", description: "Smooth R&B and soulful instrumentals", color: "#45b7d1" },
          { name: "Pop", description: "Catchy pop beats and commercial tracks", color: "#f9ca24" },
          { name: "Lo-fi", description: "Chill lo-fi hip-hop and ambient beats", color: "#6c5ce7" },
          { name: "Drill", description: "Aggressive drill beats and UK drill", color: "#a29bfe" },
          { name: "Jazz", description: "Jazz-influenced beats and instrumentals", color: "#fd79a8" },
          { name: "Electronic", description: "Electronic and EDM-style beats", color: "#00b894" }
        ];

        for (const genre of defaultGenres) {
          const genreId = randomUUID();
          const imageUrl = `/attached_assets/generated_images/${genre.name.replace(/[^a-zA-Z0-9]/g, '_')}_beat_artwork.png`;
          
          if (isProduction) {
            // PostgreSQL genre creation
            await db.run(sql`
              INSERT INTO genres (id, name, description, image_url, color, is_active, created_at, updated_at)
              VALUES (${genreId}, ${genre.name}, ${genre.description}, ${imageUrl}, ${genre.color}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
          } else {
            // SQLite genre creation
            await db.run(sql`
              INSERT INTO genres (id, name, description, image_url, color, is_active, created_at, updated_at)
              VALUES (${genreId}, ${genre.name}, ${genre.description}, ${imageUrl}, ${genre.color}, 1, datetime('now'), datetime('now'))
            `);
          }
        }
        console.log("✓ Default genres created");
      } else {
        console.log("✓ Genres already exist");
      }
    } catch (error) {
      console.error("Error initializing default genres:", error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      console.log(`Looking for user '${username}':`, result.length > 0 ? 'Found' : 'Not found');
      return result[0];
    } catch (error) {
      console.error(`Error getting user by username '${username}':`, error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      console.error("Get all users error:", error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const userData = { 
      ...insertUser, 
      password: hashedPassword,
      role: insertUser.role || "client",
      email: insertUser.email || null,
    };
    
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const updateData = {
        ...userData,
        updatedAt: new Date()
      };
      
      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const result = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Update user error:", error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Delete related data first (cascading delete)
      await this.cleanupUserData(id);
      
      // Then delete the user
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Delete user error:", error);
      return false;
    }
  }

  private async cleanupUserData(userId: string): Promise<void> {
    try {
      // Delete user's purchases
      await db.delete(purchases).where(eq(purchases.userId, userId));
      
      // Delete user's cart items
      await db.delete(cart).where(eq(cart.userId, userId));

      // Delete customer profile linked to this user
      await db.delete(customers).where(eq(customers.userId, userId));
      
      // Note: Payments are linked to purchases, so they'll be cleaned up automatically
      // when purchases are deleted due to foreign key constraints
      
      console.log(`Cleaned up data for user: ${userId}`);
    } catch (error) {
      console.error("Error cleaning up user data:", error);
      // Don't throw error here as we still want to delete the user
    }
  }

  async verifyPassword(username: string, password: string): Promise<User | undefined> {
    try {
      console.log(`Verifying password for user: ${username}`);
      const user = await this.getUserByUsername(username);
      if (!user) {
        console.log(`User '${username}' not found`);
        return undefined;
      }
      
      console.log(`User '${username}' found, checking password...`);
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`Password for '${username}':`, isValid ? 'Valid' : 'Invalid');
      return isValid ? user : undefined;
    } catch (error) {
      console.error(`Error verifying password for '${username}':`, error);
      return undefined;
    }
  }

  async changeUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
    return true;
  }

  async updateUserTheme(userId: string, theme: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;
      
      await db.update(users).set({ 
        theme: theme,
        updatedAt: new Date()
      }).where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error("Update user theme error:", error);
      return false;
    }
  }

  // Beat operations
  async getBeat(id: string): Promise<Beat | undefined> {
    const result = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    return result[0];
  }

  async getAllBeats(): Promise<Beat[]> {
    const result = await db.select().from(beats).orderBy(desc(beats.createdAt));
    return result;
  }

  async getLatestBeats(limit: number): Promise<Beat[]> {
    const result = await db.select().from(beats).orderBy(desc(beats.createdAt)).limit(limit);
    return result;
  }

  async createBeat(insertBeat: InsertBeat): Promise<Beat> {
    const result = await db.insert(beats).values(insertBeat).returning();
    return result[0];
  }

  async updateBeat(id: string, beatUpdate: Partial<InsertBeat>): Promise<Beat | undefined> {
    try {
      // Get the current beat to check for file changes
      const currentBeat = await this.getBeat(id);
      if (!currentBeat) {
        return undefined;
      }

      const result = await db.update(beats)
        .set(beatUpdate)
        .where(eq(beats.id, id))
        .returning();
      
      if (result.length > 0) {
        // Check if files were changed and clean up old files
        await this.cleanupOldBeatFiles(currentBeat, beatUpdate);
        return result[0];
      }
      
      return undefined;
    } catch (error) {
      console.error("Update beat error:", error);
      return undefined;
    }
  }

  async deleteBeat(id: string): Promise<boolean> {
    try {
      // First get the beat to access file paths
      const beat = await this.getBeat(id);
      if (!beat) {
        return false;
      }

      // Delete the beat from database
      const result = await db.delete(beats).where(eq(beats.id, id)).returning();
      
      if (result.length > 0) {
        // Delete associated files
        await this.deleteBeatFiles(beat);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Delete beat error:", error);
      return false;
    }
  }

  private async deleteBeatFiles(beat: Beat): Promise<void> {
    try {
      // Delete audio file
      if (beat.audioUrl && beat.audioUrl.startsWith('/uploads/')) {
        const audioPath = path.join(process.cwd(), beat.audioUrl);
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          console.log(`Deleted audio file: ${audioPath}`);
        }
      }

      // Delete image file (only if it's not a placeholder)
      if (beat.imageUrl && 
          beat.imageUrl.startsWith('/uploads/') && 
          !beat.imageUrl.includes('placeholder')) {
        const imagePath = path.join(process.cwd(), beat.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image file: ${imagePath}`);
        }
      }
    } catch (error) {
      console.error("Error deleting beat files:", error);
      // Don't throw error here as the database deletion was successful
    }
  }

  private async cleanupOldBeatFiles(currentBeat: Beat, beatUpdate: Partial<InsertBeat>): Promise<void> {
    try {
      // Check if audio file was changed
      if (beatUpdate.audioUrl && 
          beatUpdate.audioUrl !== currentBeat.audioUrl &&
          currentBeat.audioUrl && 
          currentBeat.audioUrl.startsWith('/uploads/')) {
        const oldAudioPath = path.join(process.cwd(), currentBeat.audioUrl);
        if (fs.existsSync(oldAudioPath)) {
          fs.unlinkSync(oldAudioPath);
          console.log(`Cleaned up old audio file: ${oldAudioPath}`);
        }
      }

      // Check if image file was changed
      if (beatUpdate.imageUrl && 
          beatUpdate.imageUrl !== currentBeat.imageUrl &&
          currentBeat.imageUrl && 
          currentBeat.imageUrl.startsWith('/uploads/') && 
          !currentBeat.imageUrl.includes('placeholder')) {
        const oldImagePath = path.join(process.cwd(), currentBeat.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Cleaned up old image file: ${oldImagePath}`);
        }
      }
    } catch (error) {
      console.error("Error cleaning up old beat files:", error);
      // Don't throw error here as the update was successful
    }
  }

  // Purchase operations
  async getPurchase(id: string): Promise<Purchase | undefined> {
    const result = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
    return result[0];
  }

  async getPurchasesByUser(userId: string): Promise<Purchase[]> {
    const result = await db.select().from(purchases).where(eq(purchases.userId, userId)).orderBy(desc(purchases.purchasedAt));
    return result;
  }

  async getAllPurchases(): Promise<Purchase[]> {
    const result = await db.select().from(purchases).orderBy(desc(purchases.purchasedAt));
    return result;
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const result = await db.insert(purchases).values(insertPurchase).returning();
    return result[0];
  }

  async getPurchaseByUserAndBeat(userId: string, beatId: string): Promise<Purchase | undefined> {
    const result = await db.select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.beatId, beatId)))
      .limit(1);
    return result[0];
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics | undefined> {
    const result = await db.select().from(analytics).limit(1);
    return result[0];
  }

  async updateAnalytics(analyticsUpdate: Partial<InsertAnalytics>): Promise<Analytics> {
    const existing = await this.getAnalytics();
    if (existing) {
      const result = await db.update(analytics)
        .set({ ...analyticsUpdate, updatedAt: new Date() })
        .where(eq(analytics.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(analytics).values({
        siteVisits: 0,
        totalDownloads: 0,
        ...analyticsUpdate,
      }).returning();
      return result[0];
    }
  }

  async incrementSiteVisits(): Promise<void> {
    const existing = await this.getAnalytics();
    if (existing) {
      await db.update(analytics)
        .set({ 
          siteVisits: sql`${analytics.siteVisits} + 1`,
          updatedAt: new Date() 
        })
        .where(eq(analytics.id, existing.id));
    } else {
      await db.insert(analytics).values({
        siteVisits: 1,
        totalDownloads: 0,
      });
    }
  }

  async incrementDownloads(): Promise<void> {
    const existing = await this.getAnalytics();
    if (existing) {
      await db.update(analytics)
        .set({ 
          totalDownloads: sql`${analytics.totalDownloads} + 1`,
          updatedAt: new Date() 
        })
        .where(eq(analytics.id, existing.id));
    } else {
      await db.insert(analytics).values({
        siteVisits: 0,
        totalDownloads: 1,
      });
    }
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Get customer error:", error);
      return undefined;
    }
  }

  async getCustomerByUserId(userId: string): Promise<Customer | undefined> {
    try {
      const result = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Get customer by user ID error:", error);
      return undefined;
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      return await db.select().from(customers).orderBy(desc(customers.createdAt));
    } catch (error) {
      console.error("Get all customers error:", error);
      return [];
    }
  }

  async getCustomersByRole(role: string): Promise<Customer[]> {
    try {
      return await db
        .select({
          id: customers.id,
          userId: customers.userId,
          username: users.username,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          city: customers.city,
          state: customers.state,
          zipCode: customers.zipCode,
          country: customers.country,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
        })
        .from(customers)
        .innerJoin(users, eq(customers.userId, users.id))
        .where(eq(users.role, role))
        .orderBy(desc(customers.createdAt));
    } catch (error) {
      console.error("Get customers by role error:", error);
      return [];
    }
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    try {
      const result = await db.insert(customers).values(insertCustomer).returning();
      return result[0];
    } catch (error) {
      console.error("Create customer error:", error);
      throw error;
    }
  }

  async updateCustomer(id: string, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      const result = await db.update(customers)
        .set({ ...customerUpdate, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Update customer error:", error);
      return undefined;
    }
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    try {
      const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Get payment error:", error);
      return undefined;
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    try {
      return await db.select().from(payments).orderBy(desc(payments.createdAt));
    } catch (error) {
      console.error("Get all payments error:", error);
      return [];
    }
  }

  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.status, status)).orderBy(desc(payments.createdAt));
    } catch (error) {
      console.error("Get payments by status error:", error);
      return [];
    }
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      const result = await db.insert(payments).values(insertPayment).returning();
      return result[0];
    } catch (error) {
      console.error("Create payment error:", error);
      throw error;
    }
  }

  async updatePaymentStatus(id: string, status: string, approvedBy?: string): Promise<Payment | undefined> {
    try {
      console.log("Updating payment status - ID:", id, "Status:", status, "ApprovedBy:", approvedBy);
      
      const updateData: any = { 
        status, 
        updatedAt: new Date() 
      };
      
      if (approvedBy && approvedBy !== 'admin') {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = new Date();
      } else if (approvedBy === 'admin') {
        // For 'admin' string, we'll skip the approvedBy field to avoid foreign key constraint
        updateData.approvedAt = new Date();
      }
      
      console.log("Update data:", updateData);
      
      const result = await db.update(payments)
        .set(updateData)
        .where(eq(payments.id, id));
      
      console.log("Update result:", result);
      
      // Fetch the updated payment
      const updatedPayment = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
      console.log("Updated payment:", updatedPayment);
      
      return updatedPayment[0];
    } catch (error) {
      console.error("Update payment status error:", error);
      return undefined;
    }
  }

  async getPaymentsWithDetails(): Promise<any[]> {
    try {
      console.log("Getting payments with details...");
      
      // First, let's check what's in the payments table
      const allPayments = await db.select().from(payments);
      console.log("All payments in database:", allPayments);
      
      const result = await db
        .select({
          payment: payments,
          customer: customers,
          purchase: purchases,
          beat: beats,
          user: users
        })
        .from(payments)
        .leftJoin(customers, eq(payments.customerId, customers.id))
        .leftJoin(purchases, eq(payments.purchaseId, purchases.id))
        .leftJoin(beats, eq(purchases.beatId, beats.id))
        .leftJoin(users, eq(customers.userId, users.id))
        .orderBy(desc(payments.createdAt));
        
      console.log("Payments with details found:", result.length, result);
      return result;
    } catch (error) {
      console.error("Get payments with details error:", error);
      return [];
    }
  }

  // Cart operations
  async getUserCart(userId: string): Promise<Beat[]> {
    try {
      console.log("Getting cart for user:", userId);
      
      // First, let's check what's in the cart table
      const allCartItems = await db.select().from(cart);
      console.log("All cart items in database:", allCartItems);
      
      const cartItems = await db
        .select({
          id: beats.id,
          title: beats.title,
          producer: beats.producer,
          bpm: beats.bpm,
          genre: beats.genre,
          price: beats.price,
          imageUrl: beats.imageUrl,
          audioUrl: beats.audioUrl,
          createdAt: beats.createdAt,
        })
        .from(cart)
        .innerJoin(beats, eq(cart.beatId, beats.id))
        .where(eq(cart.userId, userId))
        .orderBy(desc(cart.addedAt));
      
      console.log("Cart items found for user:", cartItems.length, cartItems);
      return cartItems;
    } catch (error) {
      console.error("Get user cart error:", error);
      return [];
    }
  }

  async addToCart(userId: string, beatId: string): Promise<Beat[]> {
    try {
      console.log("Adding to cart - userId:", userId, "beatId:", beatId);
      
      // Check if item already exists in cart
      const existingItem = await db
        .select()
        .from(cart)
        .where(and(eq(cart.userId, userId), eq(cart.beatId, beatId)))
        .limit(1);

      console.log("Existing cart items:", existingItem.length);

      if (existingItem.length === 0) {
        // Add to cart if not already present
        console.log("Inserting new cart item");
        await db.insert(cart).values({
          userId,
          beatId,
        });
        console.log("Cart item inserted successfully");
      } else {
        console.log("Item already in cart, skipping");
      }

      // Return updated cart
      return await this.getUserCart(userId);
    } catch (error) {
      console.error("Add to cart error:", error);
      throw error;
    }
  }

  async removeFromCart(userId: string, beatId: string): Promise<Beat[]> {
    try {
      await db
        .delete(cart)
        .where(and(eq(cart.userId, userId), eq(cart.beatId, beatId)));

      // Return updated cart
      return await this.getUserCart(userId);
    } catch (error) {
      console.error("Remove from cart error:", error);
      return [];
    }
  }

  async clearCart(userId: string): Promise<void> {
    try {
      await db
        .delete(cart)
        .where(eq(cart.userId, userId));
    } catch (error) {
      console.error("Clear cart error:", error);
      throw error;
    }
  }

  // Playlist operations
  async getUserPlaylist(userId: string): Promise<Beat[]> {
    try {
      // Get all beats that the user has purchased
      const result = await db
        .select({
          id: beats.id,
          title: beats.title,
          producer: beats.producer,
          bpm: beats.bpm,
          genre: beats.genre,
          price: beats.price,
          imageUrl: beats.imageUrl,
          audioUrl: beats.audioUrl,
          createdAt: beats.createdAt,
        })
        .from(beats)
        .innerJoin(purchases, eq(beats.id, purchases.beatId))
        .where(eq(purchases.userId, userId))
        .orderBy(desc(purchases.purchasedAt));
      
      return result;
    } catch (error) {
      console.error("Get user playlist error:", error);
      throw error;
    }
  }

  // Genre operations
  async getGenre(id: string): Promise<Genre | undefined> {
    try {
      const result = await db
        .select()
        .from(genres)
        .where(eq(genres.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Get genre error:", error);
      throw error;
    }
  }

  async getAllGenres(): Promise<Genre[]> {
    try {
      return await db
        .select()
        .from(genres)
        .orderBy(desc(genres.createdAt));
    } catch (error) {
      console.error("Get all genres error:", error);
      throw error;
    }
  }

  async getActiveGenres(): Promise<Genre[]> {
    try {
      return await db
        .select()
        .from(genres)
        .where(eq(genres.isActive, true))
        .orderBy(genres.name);
    } catch (error) {
      console.error("Get active genres error:", error);
      throw error;
    }
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    try {
      const result = await db
        .insert(genres)
        .values(genre)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Create genre error:", error);
      throw error;
    }
  }

  async updateGenre(id: string, genre: Partial<InsertGenre>): Promise<Genre | undefined> {
    try {
      const result = await db
        .update(genres)
        .set({ ...genre, updatedAt: new Date() })
        .where(eq(genres.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Update genre error:", error);
      throw error;
    }
  }

  async deleteGenre(id: string): Promise<boolean> {
    try {
      // Get the genre to access image path
      const genre = await this.getGenre(id);
      if (!genre) {
        return false;
      }

      const result = await db
        .delete(genres)
        .where(eq(genres.id, id));
      
      if (result.changes > 0) {
        // Delete associated image file
        await this.deleteGenreImage(genre);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Delete genre error:", error);
      throw error;
    }
  }

  private async deleteGenreImage(genre: Genre): Promise<void> {
    try {
      // Delete image file (only if it's not a placeholder)
      if (genre.imageUrl && 
          genre.imageUrl.startsWith('/uploads/') && 
          !genre.imageUrl.includes('placeholder')) {
        const imagePath = path.join(process.cwd(), genre.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted genre image file: ${imagePath}`);
        }
      }
    } catch (error) {
      console.error("Error deleting genre image file:", error);
      // Don't throw error here as the database deletion was successful
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      console.log("Starting database reset...");
      
      // Disable foreign key constraints temporarily
      await db.run(sql`PRAGMA foreign_keys = OFF`);
      console.log("Disabled foreign key constraints");
      
      // Clear all tables (order doesn't matter with foreign keys disabled)
      try {
        await db.delete(cart);
        console.log("✓ Cleared cart table");
      } catch (error) {
        console.log("⚠️ Cart table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(payments);
        console.log("✓ Cleared payments table");
      } catch (error) {
        console.log("⚠️ Payments table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(purchases);
        console.log("✓ Cleared purchases table");
      } catch (error) {
        console.log("⚠️ Purchases table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(beats);
        console.log("✓ Cleared beats table");
      } catch (error) {
        console.log("⚠️ Beats table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(customers);
        console.log("✓ Cleared customers table");
      } catch (error) {
        console.log("⚠️ Customers table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(analytics);
        console.log("✓ Cleared analytics table");
      } catch (error) {
        console.log("⚠️ Analytics table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(genres);
        console.log("✓ Cleared genres table");
      } catch (error) {
        console.log("⚠️ Genres table clear failed (may be empty):", error);
      }
      
      try {
        await db.delete(users);
        console.log("✓ Cleared users table");
      } catch (error) {
        console.log("⚠️ Users table clear failed (may be empty):", error);
      }
      
      // Re-enable foreign key constraints
      await db.run(sql`PRAGMA foreign_keys = ON`);
      console.log("✓ Re-enabled foreign key constraints");
      
      // Create default admin user after clearing all users
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(users).values({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          email: 'admin@beatbazaar.com',
          passwordChangeRequired: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("✓ Created default admin user: admin/admin123");
      } catch (error) {
        console.log("⚠️ Failed to create default admin user:", error);
      }
      
      // Initialize analytics with some sample data
      try {
        await db.insert(analytics).values({
          siteVisits: 0,
          totalDownloads: 0,
          updatedAt: new Date(),
        });
        console.log("✓ Initialized analytics");
      } catch (error) {
        console.log("⚠️ Failed to initialize analytics:", error);
      }
      
      console.log("✅ Database reset completed successfully");
    } catch (error) {
      console.error("❌ Database reset error:", error);
      // Try to re-enable foreign keys even if there was an error
      try {
        await db.run(sql`PRAGMA foreign_keys = ON`);
        console.log("✓ Re-enabled foreign key constraints after error");
      } catch (e) {
        console.error("❌ Failed to re-enable foreign keys:", e);
      }
      throw error;
    }
  }

  // Verification code operations
  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    try {
      const result = await db
        .insert(verificationCodes)
        .values(code)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Create verification code error:", error);
      throw error;
    }
  }

  async getVerificationCode(userId: string, code: string, type: string): Promise<VerificationCode | undefined> {
    try {
      const result = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.code, code),
            eq(verificationCodes.type, type),
            eq(verificationCodes.used, false),
            sql`${verificationCodes.expiresAt} > ${Date.now()}`
          )
        )
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Get verification code error:", error);
      return undefined;
    }
  }

  async markVerificationCodeAsUsed(id: string): Promise<boolean> {
    try {
      const result = await db
        .update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, id));
      
      return result.changes > 0;
    } catch (error) {
      console.error("Mark verification code as used error:", error);
      return false;
    }
  }

  async cleanupExpiredVerificationCodes(): Promise<void> {
    try {
      await db
        .delete(verificationCodes)
        .where(sql`${verificationCodes.expiresAt} <= ${Date.now()}`);
      
      console.log("✓ Cleaned up expired verification codes");
    } catch (error) {
      console.error("Cleanup expired verification codes error:", error);
    }
  }

  // Email settings operations
  async getEmailSettings(): Promise<EmailSettings | undefined> {
    try {
      const result = await db
        .select()
        .from(emailSettings)
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Get email settings error:", error);
      return undefined;
    }
  }

  async updateEmailSettings(settings: Partial<InsertEmailSettings>): Promise<EmailSettings> {
    try {
      // Check if email settings exist
      const existingSettings = await this.getEmailSettings();
      
      if (existingSettings) {
        // Update existing settings
        const result = await db
          .update(emailSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(emailSettings.id, existingSettings.id))
          .returning();
        
        return result[0];
      } else {
        // Create new settings
        const result = await db
          .insert(emailSettings)
          .values({
            ...settings,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Update email settings error:", error);
      throw error;
    }
  }

  // Social media settings operations
  async getSocialMediaSettings(): Promise<SocialMediaSettings | undefined> {
    try {
      const result = await db
        .select()
        .from(socialMediaSettings)
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Get social media settings error:", error);
      return undefined;
    }
  }

  async updateSocialMediaSettings(settings: Partial<InsertSocialMediaSettings>): Promise<SocialMediaSettings> {
    try {
      // Check if social media settings exist
      const existingSettings = await this.getSocialMediaSettings();
      
      if (existingSettings) {
        // Update existing settings
        const result = await db
          .update(socialMediaSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(socialMediaSettings.id, existingSettings.id))
          .returning();
        
        return result[0];
      } else {
        // Create new settings
        const result = await db
          .insert(socialMediaSettings)
          .values({
            ...settings,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Update social media settings error:", error);
      throw error;
    }
  }

  // Contact settings operations
  async getContactSettings(): Promise<ContactSettings | undefined> {
    try {
      const result = await db
        .select()
        .from(contactSettings)
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Get contact settings error:", error);
      return undefined;
    }
  }

  async updateContactSettings(settings: Partial<InsertContactSettings>): Promise<ContactSettings> {
    try {
      // Check if contact settings exist
      const existingSettings = await this.getContactSettings();
      
      if (existingSettings) {
        // Update existing settings
        const result = await db
          .update(contactSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(contactSettings.id, existingSettings.id))
          .returning();
        
        return result[0];
      } else {
        // Create new settings
        const result = await db
          .insert(contactSettings)
          .values({
            ...settings,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Update contact settings error:", error);
      throw error;
    }
  }

  // Plans settings operations
  async getPlansSettings(): Promise<PlansSettings | undefined> {
    try {
      const result = await db
        .select()
        .from(plansSettings)
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Get plans settings error:", error);
      return undefined;
    }
  }

  async updatePlansSettings(settings: Partial<InsertPlansSettings>): Promise<PlansSettings> {
    try {
      // Check if plans settings exist
      const existingSettings = await this.getPlansSettings();
      
      if (existingSettings) {
        // Update existing settings
        const result = await db
          .update(plansSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(plansSettings.id, existingSettings.id))
          .returning();
        
        return result[0];
      } else {
        // Create new settings
        const result = await db
          .insert(plansSettings)
          .values({
            ...settings,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Update plans settings error:", error);
      throw error;
    }
  }
  

  // Artist bio operations
  async getArtistBios(): Promise<ArtistBio[]> {
    try {
      const result = await db
        .select()
        .from(artistBios)
        .where(eq(artistBios.isActive, true))
        .orderBy(artistBios.sortOrder, artistBios.createdAt);
      
      return result;
    } catch (error) {
      console.error("Get artist bios error:", error);
      return [];
    }
  }

  async getArtistBio(id: string): Promise<ArtistBio | undefined> {
    try {
      const result = await db
        .select()
        .from(artistBios)
        .where(eq(artistBios.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Get artist bio error:", error);
      return undefined;
    }
  }

  async createArtistBio(bio: InsertArtistBio): Promise<ArtistBio> {
    try {
      const result = await db
        .insert(artistBios)
        .values({
          ...bio,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Create artist bio error:", error);
      throw error;
    }
  }

  async updateArtistBio(id: string, bio: Partial<InsertArtistBio>): Promise<ArtistBio> {
    try {
      const result = await db
        .update(artistBios)
        .set({
          ...bio,
          updatedAt: new Date()
        })
        .where(eq(artistBios.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Artist bio not found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Update artist bio error:", error);
      throw error;
    }
  }

  async deleteArtistBio(id: string): Promise<void> {
    try {
      await db
        .delete(artistBios)
        .where(eq(artistBios.id, id));
    } catch (error) {
      console.error("Delete artist bio error:", error);
      throw error;
    }
  }

  // App Branding Settings
  async getAppBrandingSettings(): Promise<AppBrandingSettings | null> {
    try {
      const result = await db
        .select()
        .from(appBrandingSettings)
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("Get app branding settings error:", error);
      throw error;
    }
  }

  async updateAppBrandingSettings(settings: Partial<AppBrandingSettings>): Promise<AppBrandingSettings> {
    try {
      const existing = await this.getAppBrandingSettings();
      
      if (existing) {
        const result = await db
          .update(appBrandingSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(appBrandingSettings.id, existing.id))
          .returning();
        
        return result[0];
      } else {
        const result = await db
          .insert(appBrandingSettings)
          .values({
            ...settings,
            id: `app-branding-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Update app branding settings error:", error);
      throw error;
    }
  }
  
  

  
private async deleteAllUploadedFiles(): Promise<void> {
    try {
      console.log("🗑️ Deleting all uploaded files...");
      
      // Delete all audio files
      const audioDir = path.join(process.cwd(), 'uploads', 'audio');
      if (fs.existsSync(audioDir)) {
        const audioFiles = fs.readdirSync(audioDir);
        for (const file of audioFiles) {
          const filePath = path.join(audioDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            console.log(`Deleted audio file: ${file}`);
          }
        }
      }
      
      // Delete all image files
      const imageDir = path.join(process.cwd(), 'uploads', 'images');
      if (fs.existsSync(imageDir)) {
        const imageFiles = fs.readdirSync(imageDir);
        for (const file of imageFiles) {
          const filePath = path.join(imageDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            console.log(`Deleted image file: ${file}`);
          }
        }
      }
      
      console.log("✅ All uploaded files deleted");
    } catch (error) {
      console.error("❌ Error deleting uploaded files:", error);
      throw error;
    }
  }

  private async clearAllTables(): Promise<void> {
    try {
      console.log("🧹 Clearing all database tables...");
      
      // Clear all tables in the correct order (respecting foreign key constraints)
      await db.run(sql`DELETE FROM purchases`);
      await db.run(sql`DELETE FROM cart`);
      await db.run(sql`DELETE FROM payments`);
      await db.run(sql`DELETE FROM beats`);
      await db.run(sql`DELETE FROM customers`);
      await db.run(sql`DELETE FROM verification_codes`);
      await db.run(sql`DELETE FROM email_settings`);
      await db.run(sql`DELETE FROM social_media_settings`);
      await db.run(sql`DELETE FROM contact_settings`);
      await db.run(sql`DELETE FROM plans_settings`);
      await db.run(sql`DELETE FROM app_branding_settings`);
      await db.run(sql`DELETE FROM artist_bios`);
      await db.run(sql`DELETE FROM genres`);
      await db.run(sql`DELETE FROM analytics`);
      await db.run(sql`DELETE FROM users WHERE username != 'admin'`);
      
      console.log("✅ All tables cleared");
    } catch (error) {
      console.error("❌ Error clearing tables:", error);
      throw error;
    }
  }
}



export const storage = new DatabaseStorage();