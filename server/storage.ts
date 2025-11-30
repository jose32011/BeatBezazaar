import path from "path";
import fs from "fs";
import { 
  stripeSettings,
  stripeTransactions
} from "@shared/schema";
// import types from schema as needed below to avoid circular/type noise
import type { StripeSettings, InsertStripeSettings, StripeTransaction, InsertStripeTransaction } from "@shared/schema";
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
  // VerificationCode types (infer from schema types)
  // Note: use generic any here to avoid type conflicts until schema is cleaned up
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
// Note: SQLite support removed — application requires MySQL-only runtime
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
// (better-sqlite3 import removed)
import postgres from "postgres";
import mysql from "mysql2/promise";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Database configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
let db: any;
let mysqlPool: any = undefined;

/**
 * Database selection logic
 * Priority:
 * 1) If running in production and DATABASE_URL is provided, inspect its scheme:
 *    - postgres:// or postgresql:// -> use Postgres
 *    - mysql:// -> use MySQL
 * 2) If RAILWAY_MYSQL_ env vars are provided (Railway), use them to build a MySQL connection
 * 3) Fallback to SQLite for local development
 */
const datasourceUrl = process.env.DATABASE_URL || '';
const railwayHasMySql = !!(process.env.RAILWAY_MYSQL_HOST && process.env.RAILWAY_MYSQL_USERNAME && process.env.RAILWAY_MYSQL_PASSWORD && process.env.RAILWAY_MYSQL_DB);

// Prefer DATABASE_URL if it points to MySQL, otherwise use Railway or explicit MYSQL_* vars
let mysqlUri: string | undefined;
if (datasourceUrl && datasourceUrl.startsWith('mysql')) {
  mysqlUri = datasourceUrl;
} else if (railwayHasMySql) {
  const host = process.env.RAILWAY_MYSQL_HOST;
  const user = process.env.RAILWAY_MYSQL_USERNAME;
  const password = process.env.RAILWAY_MYSQL_PASSWORD;
  const database = process.env.RAILWAY_MYSQL_DB;
  const port = process.env.RAILWAY_MYSQL_PORT || '3306';
  mysqlUri = `mysql://${encodeURIComponent(user || '')}:${encodeURIComponent(password || '')}@${host}:${port}/${encodeURIComponent(database || '')}`;
} else if (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DB) {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DB;
  const port = process.env.MYSQL_PORT || '3306';
  mysqlUri = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

const mysqlConfigured = !!mysqlUri || railwayHasMySql || (!!process.env.MYSQL_HOST && !!process.env.MYSQL_USER && !!process.env.MYSQL_DB);

// Initialize MySQL pool and Drizzle adapter if configured; otherwise provide a stub db so server can start
if (mysqlConfigured) {
  try {
    const pool = mysql.createPool(mysqlUri!);
      mysqlPool = pool;
    db = drizzleMysql(pool);
    console.log(`✓ Using MySQL database (${mysqlUri && mysqlUri.startsWith('mysql://') ? 'from env' : 'configured'})`);
  } catch (err) {
    console.error('Failed to create MySQL pool:', err);
    // Fall back to a safe inert stub so the server can start and the setup UI can run.
    const notConfiguredError = new Error('Database initialization failed. See server logs.');
    const noopAsync = async (..._args: any[]) => {
      console.warn('Attempted DB operation while DB init failed:', notConfiguredError.message);
      return null;
    };
    db = new Proxy({}, {
      get() { return noopAsync; }
    });
  }
} else {
  console.warn('MySQL is not configured. Server will start in setup mode. Use /api/setup to configure the database.');
  const notConfiguredError = new Error('MySQL is not configured. Use /api/setup to configure the database.');
  const noopAsync = async (..._args: any[]) => {
    // Log once to help debugging but avoid crashing the import phase
    console.warn('DB operation attempted while MySQL is not configured. Use /api/setup to configure the DB.');
    return null;
  };
  db = new Proxy({}, {
    get() { return noopAsync; }
  });
}

let isMySQL = mysqlConfigured;

// If running in production with a DATABASE_URL that points to Postgres, use it.
if (isProduction && datasourceUrl && datasourceUrl.startsWith('postgres')) {
  const client = postgres(datasourceUrl);
  db = drizzlePg(client);
  console.log("✓ Using PostgreSQL database (from DATABASE_URL)");
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
  getBeatsByGenre(genreId: string, limit?: number): Promise<Beat[]>;
  createBeat(beat: InsertBeat): Promise<Beat>;
  updateBeat(id: string, beat: Partial<InsertBeat>): Promise<Beat | undefined>;
  deleteBeat(id: string): Promise<boolean>;
  
  // Purchase operations
  getPurchase(id: string): Promise<Purchase | undefined>;
  getPurchasesByUser(userId: string): Promise<Purchase[]>;
  getAllPurchases(): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchaseByUserAndBeat(userId: string, beatId: string): Promise<Purchase | undefined>;
  userOwnsBeat(userId: string, beatId: string): Promise<boolean>;
  
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
  getActiveGenresWithBeats(limit?: number): Promise<Array<{ genre: Genre; beats: Beat[]; totalBeats: number }>>;
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

  // Stripe settings operations
  getStripeSettings(): Promise<StripeSettings | undefined>;
  updateStripeSettings(settings: Partial<InsertStripeSettings>): Promise<StripeSettings>;
  
  // Stripe transaction operations
  createStripeTransaction(transaction: InsertStripeTransaction): Promise<StripeTransaction>;
  getStripeTransaction(id: string): Promise<StripeTransaction | undefined>;
  getStripeTransactionByPaymentIntent(paymentIntentId: string): Promise<StripeTransaction | undefined>;
  updateStripeTransaction(id: string, transaction: Partial<InsertStripeTransaction>): Promise<StripeTransaction | undefined>;
  getStripeTransactionsByPaymentId(paymentId: string): Promise<StripeTransaction[]>;
}


export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  // Public helper to run when DB becomes available at runtime
  public async onDatabaseReady() {
    try {
      if (!isMySQL) return;
      // Ensure tables are created
      await createMySQLTablesUsingDb(db);

      // Ensure admin exists; use safe default if missing
      try {
        const adminUser = await this.getUserByUsername('admin');
        if (!adminUser) {
          const id = randomUUID();
          // default password; caller should set a real password via setup
          await this.createUser({ id, username: 'admin', password: 'admin123', role: 'admin', email: 'admin@beatbazaar.com' } as any);
          console.log('✅ Default admin created during reinitialization');
        }
      } catch (e) {
        console.error('Error ensuring admin user during reinitialization:', e);
      }
    } catch (e) {
      console.error('onDatabaseReady error:', e);
    }
  }

  private async initializeDatabase() {
    try {
      if (!isMySQL) {
        console.log('MySQL is not configured — skipping database initialization. Use /api/setup to configure the DB.');
        return;
      }
      console.log("🚀 Starting database initialization...");
      
      // Create tables if they don't exist
      await this.createTables();

      // Check if password_change_required column exists, if not add it
      // Use the raw mysql pool for DDL checks/ALTERs to avoid adapter method mismatches
      if (mysqlPool) {
        try {
          const [rows]: any = await mysqlPool.execute("SHOW COLUMNS FROM users LIKE 'password_change_required'");
          if (Array.isArray(rows) && rows.length > 0) {
            console.log("✓ password_change_required column exists");
          } else {
            console.log("⚠️ password_change_required column missing, adding it...");
            try {
              if (isProduction) {
                await mysqlPool.execute("ALTER TABLE users ADD COLUMN password_change_required BOOLEAN DEFAULT true");
              } else {
                await mysqlPool.execute("ALTER TABLE users ADD COLUMN password_change_required TINYINT(1) DEFAULT 1");
              }
              console.log("✓ Added password_change_required column");
            } catch (alterError) {
              console.error("❌ Failed to add password_change_required column:", alterError);
            }
          }
        } catch (e) {
          console.error('Error checking password_change_required column via mysqlPool:', e);
        }
      } else {
        console.log('mysqlPool not available — skipping password_change_required column existence check (will rely on DDL runner)');
      }

      // Check if theme column exists, if not add it (use mysqlPool for raw DDL)
      if (mysqlPool) {
        try {
          const [rows]: any = await mysqlPool.execute("SHOW COLUMNS FROM users LIKE 'theme'");
          if (Array.isArray(rows) && rows.length > 0) {
            console.log("✓ theme column exists");
          } else {
            console.log("⚠️ theme column missing, adding it...");
            try {
              await mysqlPool.execute("ALTER TABLE users ADD COLUMN theme VARCHAR(100) DEFAULT 'original'");
              console.log("✓ Added theme column");
            } catch (alterError) {
              console.error("❌ Failed to add theme column:", alterError);
            }
          }
        } catch (e) {
          console.error('Error checking theme column via mysqlPool:', e);
        }
      } else {
        console.log('mysqlPool not available — skipping theme column existence check (will rely on DDL runner)');
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
          
          // Create admin user using Drizzle ORM insert
          await db.insert(users).values({
            id: adminId,
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            email: 'admin@beatbazaar.com',
            passwordChangeRequired: 1,
            theme: 'original',
            createdAt: new Date(),
            updatedAt: new Date()
          } as any);
          
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
            if (mysqlPool) {
              await mysqlPool.execute('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',[newHashedPassword, 'admin']);
            } else {
              await db.update(users).set({ password: newHashedPassword, updatedAt: new Date() }).where(eq(users.username, 'admin'));
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
        if (mysqlPool) {
          // Probe by attempting a simple select; if it fails, columns likely missing
          await mysqlPool.execute('SELECT facebook_url FROM contact_settings LIMIT 1');
        } else {
          await db.select().from(contactSettings).limit(1);
        }
        console.log("✓ Social media columns exist in contact_settings");
      } catch (error) {
        console.log("⚠️ Social media columns missing in contact_settings, adding them...");
        try {
          if (mysqlPool) {
            await mysqlPool.execute("ALTER TABLE contact_settings ADD COLUMN facebook_url TEXT NOT NULL DEFAULT ''");
            await mysqlPool.execute("ALTER TABLE contact_settings ADD COLUMN instagram_url TEXT NOT NULL DEFAULT ''");
            await mysqlPool.execute("ALTER TABLE contact_settings ADD COLUMN twitter_url TEXT NOT NULL DEFAULT ''");
            await mysqlPool.execute("ALTER TABLE contact_settings ADD COLUMN youtube_url TEXT NOT NULL DEFAULT ''");
            await mysqlPool.execute("ALTER TABLE contact_settings ADD COLUMN tiktok_url TEXT NOT NULL DEFAULT ''");
          }
          console.log("✓ Added social media columns to contact_settings");
        } catch (alterError) {
          console.error("❌ Failed to add social media columns to contact_settings:", alterError);
        }
      }

      console.log("Database initialized");
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  }

  private async createTables() {
    try {
      console.log("🏗️ Creating MySQL database tables (MySQL-only runtime)");
      await this.createMySQLTables();
      console.log("✅ Database tables created/verified");
    } catch (error) {
      console.error("❌ Error creating tables:", error);
      throw error;
    }
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

  private async createMySQLTables() {
    // delegate to shared exported helper
    // Prefer using the raw mysql pool when available (it supports execute/query reliably)
    await createMySQLTablesUsingDb(mysqlPool || db);
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
          try {
            await db.insert(genres).values({
              id: genreId,
              name: genre.name,
              description: genre.description,
              imageUrl,
              color: genre.color,
              isActive: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);
          } catch (e) {
            console.error('Failed to insert default genre', genre.name, e);
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
    
    // MySQL adapter may not support .returning(); perform insert then select to return the created user
    const id = (userData as any).id || randomUUID();
    (userData as any).id = id;
    await db.insert(users).values(userData as any);
    const inserted = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return inserted[0];
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
      
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, id));
      
      // Fetch and return the updated user
      const updated = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return updated[0];
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

  async getBeatsByGenre(genreId: string, limit?: number): Promise<Beat[]> {
    let query = db.select().from(beats).where(eq(beats.genre, genreId)).orderBy(desc(beats.createdAt));
    if (limit) {
      query = query.limit(limit) as any;
    }
    const result = await query;
    return result;
  }

  async createBeat(insertBeat: InsertBeat): Promise<Beat> {
    // MySQL adapter may not support .returning(); perform insert then select to return the created beat
    const id = (insertBeat as any).id || randomUUID();
    const beatData = { ...insertBeat, id } as any;
    
    await db.insert(beats).values(beatData);
    const inserted = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    return inserted[0];
  }

  async updateBeat(id: string, beatUpdate: Partial<InsertBeat>): Promise<Beat | undefined> {
    try {
      // Get the current beat to check for file changes
      const currentBeat = await this.getBeat(id);
      if (!currentBeat) {
        return undefined;
      }

      await db.update(beats)
        .set(beatUpdate)
        .where(eq(beats.id, id));
      
      // Check if files were changed and clean up old files
      await this.cleanupOldBeatFiles(currentBeat, beatUpdate);
      
      // Fetch and return the updated beat
      const updated = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
      return updated[0];
      
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
      await db.delete(beats).where(eq(beats.id, id));
      
      // Delete associated files
      await this.deleteBeatFiles(beat);
      return true;
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
    const result = await db
      .select({
        id: purchases.id,
        userId: purchases.userId,
        beatId: purchases.beatId,
        price: purchases.price,
        purchasedAt: purchases.purchasedAt,
        beat: beats
      })
      .from(purchases)
      .leftJoin(beats, eq(purchases.beatId, beats.id))
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));
    
    return result as any;
  }

  async getAllPurchases(): Promise<Purchase[]> {
    const result = await db
      .select({
        id: purchases.id,
        userId: purchases.userId,
        beatId: purchases.beatId,
        price: purchases.price,
        purchasedAt: purchases.purchasedAt,
        beat: beats
      })
      .from(purchases)
      .leftJoin(beats, eq(purchases.beatId, beats.id))
      .orderBy(desc(purchases.purchasedAt));
    
    return result as any;
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    // MySQL adapter may not support .returning(); perform insert then select to return the created purchase
    const id = (insertPurchase as any).id || randomUUID();
    const purchaseData = { ...insertPurchase, id } as any;
    
    await db.insert(purchases).values(purchaseData);
    const inserted = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
    return inserted[0];
  }

  async getPurchaseByUserAndBeat(userId: string, beatId: string): Promise<Purchase | undefined> {
    const result = await db.select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.beatId, beatId)))
      .limit(1);
    return result[0];
  }

  /**
   * Check whether a given user actually owns a beat (purchase completed).
   * This is safer than relying on a purchases row alone because purchases
   * may be created before payment is completed. We require an associated
   * payment with status 'completed' (or 'approved') to consider the beat owned.
   */
  async userOwnsBeat(userId: string, beatId: string): Promise<boolean> {
    try {
      const result = await db.select()
        .from(purchases)
        .innerJoin(payments, eq(purchases.id, payments.purchaseId))
        .where(
          and(
            eq(purchases.userId, userId),
            eq(purchases.beatId, beatId),
            sql`${payments.status} = 'completed' OR ${payments.status} = 'approved'`
          )
        )
        .limit(1);

      return (result && result.length > 0);
    } catch (error) {
      console.error('Error checking ownership for user:', userId, 'beat:', beatId, error);
      return false;
    }
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics | undefined> {
    const result = await db.select().from(analytics).limit(1);
    return result[0];
  }

  async updateAnalytics(analyticsUpdate: Partial<InsertAnalytics>): Promise<Analytics> {
    const existing = await this.getAnalytics();
    if (existing) {
      await db.update(analytics)
        .set({ ...analyticsUpdate, updatedAt: new Date() })
        .where(eq(analytics.id, existing.id));
      
      // Fetch and return the updated analytics
      const updated = await db.select().from(analytics).where(eq(analytics.id, existing.id)).limit(1);
      return updated[0];
    } else {
      const id = randomUUID();
      const analyticsData = {
        id,
        siteVisits: 0,
        totalDownloads: 0,
        ...analyticsUpdate,
      } as any;
      
      await db.insert(analytics).values(analyticsData);
      const inserted = await db.select().from(analytics).where(eq(analytics.id, id)).limit(1);
      return inserted[0];
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
      // MySQL adapter may not support .returning(); perform insert then select to return the created customer
      const id = (insertCustomer as any).id || randomUUID();
      const customerData = { ...insertCustomer, id } as any;
      
      await db.insert(customers).values(customerData);
      const inserted = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
      return inserted[0];
    } catch (error) {
      console.error("Create customer error:", error);
      throw error;
    }
  }

  async updateCustomer(id: string, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      await db.update(customers)
        .set({ ...customerUpdate, updatedAt: new Date() })
        .where(eq(customers.id, id));
      
      // Fetch and return the updated customer
      const updated = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
      return updated[0];
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
      // MySQL adapter may not support .returning(); perform insert then select to return the created payment
      const id = (insertPayment as any).id || randomUUID();
      const paymentData = { ...insertPayment, id } as any;
      
      await db.insert(payments).values(paymentData);
      const inserted = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
      return inserted[0];
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
  .where(eq(genres.isActive, 1))
        .orderBy(genres.name);
    } catch (error) {
      console.error("Get active genres error:", error);
      throw error;
    }
  }

  async getActiveGenresWithBeats(limit: number = 10): Promise<Array<{ genre: Genre; beats: Beat[]; totalBeats: number }>> {
    try {
      // Get all active genres
      const activeGenres = await this.getActiveGenres();
      
      // For each genre, fetch beats with limit and total count
      const genresWithBeats = await Promise.all(
        activeGenres.map(async (genre) => {
          // Get all beats for this genre to count total
          const allBeats = await this.getBeatsByGenre(genre.id);
          const totalBeats = allBeats.length;
          
          // Get limited beats for preview
          const beats = await this.getBeatsByGenre(genre.id, limit);
          
          return {
            genre,
            beats,
            totalBeats
          };
        })
      );
      
      // Filter out genres with no beats
      return genresWithBeats.filter(item => item.totalBeats > 0);
    } catch (error) {
      console.error("Get active genres with beats error:", error);
      throw error;
    }
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    try {
      // MySQL adapter may not support .returning(); perform insert then select to return the created genre
      const id = (genre as any).id || randomUUID();
      const genreData = { ...genre, id } as any;
      
      await db.insert(genres).values(genreData);
      const inserted = await db.select().from(genres).where(eq(genres.id, id)).limit(1);
      return inserted[0];
    } catch (error) {
      console.error("Create genre error:", error);
      throw error;
    }
  }

  async updateGenre(id: string, genre: Partial<InsertGenre>): Promise<Genre | undefined> {
    try {
      await db
        .update(genres)
        .set({ ...genre, updatedAt: new Date() })
        .where(eq(genres.id, id));
      
      // Fetch and return the updated genre
      const updated = await db.select().from(genres).where(eq(genres.id, id)).limit(1);
      return updated[0];
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
      
      // Disable foreign key constraints temporarily (SQLite uses PRAGMA, MySQL uses FOREIGN_KEY_CHECKS)
      if (isMySQL) {
        if (mysqlPool) { await mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0'); }
      } else {
        // no-op for non-MySQL path in MySQL-only runtime
      }
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
      if (isMySQL) {
        if (mysqlPool) { await mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 1'); }
      } else {
        // no-op for non-MySQL path in MySQL-only runtime
      }
      console.log("✓ Re-enabled foreign key constraints");
      
      // Create default admin user after clearing all users
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(users).values({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          email: 'admin@beatbazaar.com',
          passwordChangeRequired: 1 as any,
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
        if (isMySQL) {
          if (mysqlPool) { await mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 1'); }
        } else {
          // no-op for non-MySQL path in MySQL-only runtime
        }
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
            eq(verificationCodes.used, 0),
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
  .set({ used: 1 })
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
      if (!isMySQL) {
        // Return sensible defaults when DB not configured (setup mode)
        return {
          id: 'default',
          enabled: 0,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpSecure: 0,
          smtpUser: '',
          smtpPass: '',
          fromName: 'BeatBazaar',
          fromEmail: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as EmailSettings;
      }

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
      const existingSettings = await this.getEmailSettings();
      const now = new Date();

      if (existingSettings) {
        await db
          .update(emailSettings)
          .set({
            ...settings,
            updatedAt: now
          })
          .where(eq(emailSettings.id, existingSettings.id));

        const updated = await db
          .select()
          .from(emailSettings)
          .where(eq(emailSettings.id, existingSettings.id))
          .limit(1);
        return updated[0];
      } else {
        const newId = `email-settings-${Date.now()}`;
        await db
          .insert(emailSettings)
          .values({
            id: newId as any,
            ...settings,
            createdAt: now,
            updatedAt: now
          });
        const created = await db
          .select()
          .from(emailSettings)
          .where(eq(emailSettings.id, newId as any))
          .limit(1);
        return created[0];
      }
    } catch (error) {
      console.error("Update email settings error:", error);
      throw error;
    }
  }

  // Social media settings operations
  async getSocialMediaSettings(): Promise<SocialMediaSettings | undefined> {
    try {
      if (!isMySQL) {
        return {
          id: 'default',
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          youtubeUrl: '',
          tiktokUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as SocialMediaSettings;
      }

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
      const existingSettings = await this.getSocialMediaSettings();
      const now = new Date();

      if (existingSettings) {
        await db
          .update(socialMediaSettings)
          .set({
            ...settings,
            updatedAt: now
          })
          .where(eq(socialMediaSettings.id, existingSettings.id));

        const updated = await db
          .select()
          .from(socialMediaSettings)
          .where(eq(socialMediaSettings.id, existingSettings.id))
          .limit(1);
        return updated[0];
      } else {
        const newId = `social-media-settings-${Date.now()}`;
        await db
          .insert(socialMediaSettings)
          .values({
            id: newId as any,
            ...settings,
            createdAt: now,
            updatedAt: now
          });
        const created = await db
          .select()
          .from(socialMediaSettings)
          .where(eq(socialMediaSettings.id, newId as any))
          .limit(1);
        return created[0];
      }
    } catch (error) {
      console.error("Update social media settings error:", error);
      throw error;
    }
  }

  // Contact settings operations
  async getContactSettings(): Promise<ContactSettings | undefined> {
    try {
      if (!isMySQL) {
        return {
          id: 'default',
          bandImageUrl: '',
          bandName: 'BeatBazaar',
          contactEmail: 'contact@beatbazaar.com',
          contactPhone: '+1 (555) 123-4567',
          contactAddress: '123 Music Street',
          contactCity: 'Los Angeles',
          contactState: 'CA',
          contactZipCode: '90210',
          contactCountry: 'USA',
          messageEnabled: 1,
          messageSubject: 'New Contact Form Submission',
          messageTemplate: 'You have received a new message from your contact form.',
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          youtubeUrl: '',
          tiktokUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ContactSettings;
      }

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
      const existingSettings = await this.getContactSettings();
      const now = new Date();

      if (existingSettings) {
        await db
          .update(contactSettings)
          .set({
            ...settings,
            updatedAt: now
          })
          .where(eq(contactSettings.id, existingSettings.id));

        const updated = await db
          .select()
          .from(contactSettings)
          .where(eq(contactSettings.id, existingSettings.id))
          .limit(1);
        return updated[0];
      } else {
        const newId = `contact-settings-${Date.now()}`;
        await db
          .insert(contactSettings)
          .values({
            id: newId as any,
            ...settings,
            createdAt: now,
            updatedAt: now
          });
        const created = await db
          .select()
          .from(contactSettings)
          .where(eq(contactSettings.id, newId as any))
          .limit(1);
        return created[0];
      }
    } catch (error) {
      console.error("Update contact settings error:", error);
      throw error;
    }
  }

  // Plans settings operations
  async getPlansSettings(): Promise<PlansSettings | undefined> {
    try {
      if (!isMySQL) {
        // Provide a minimal default plans settings object
        return {
          id: 'default',
          pageTitle: 'Beat Licensing Plans',
          pageSubtitle: 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.',
          basicPlan: { name: 'Basic License', price: 29, description: '', features: [], isActive: true },
          premiumPlan: { name: 'Premium License', price: 99, description: '', features: [], isActive: true, isPopular: false },
          exclusivePlan: { name: 'Exclusive Rights', price: 999, description: '', features: [], isActive: true },
          additionalFeaturesTitle: 'Why Choose BeatBazaar?',
          additionalFeatures: [],
          faqSection: { title: '', questions: [] },
          trustBadges: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PlansSettings;
      }

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
  .where(eq(artistBios.isActive, 1))
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
      if (!isMySQL) {
        return {
          id: `app-branding-default`,
          appName: 'BeatBazaar',
          appLogo: '',
          heroTitle: 'Discover Your Sound',
          heroSubtitle: 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
          heroImage: '',
          heroButtonText: 'Start Creating',
          heroButtonLink: '/beats',
          loginTitle: 'Welcome Back',
          loginSubtitle: 'Sign in to your account to continue',
          loginImage: '',
          createdAt: new Date(),
          updatedAt: new Date()
        } as AppBrandingSettings;
      }

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
      const now = new Date();

      if (existing) {
        await db
          .update(appBrandingSettings)
          .set({
            ...settings,
            updatedAt: now
          })
          .where(eq(appBrandingSettings.id, existing.id));

        const updated = await db
          .select()
          .from(appBrandingSettings)
          .where(eq(appBrandingSettings.id, existing.id))
          .limit(1);
        return updated[0];
      } else {
        const newId = `app-branding-${Date.now()}`;
        await db
          .insert(appBrandingSettings)
          .values({
            id: newId as any,
            ...settings,
            createdAt: now,
            updatedAt: now
          });
        const created = await db
          .select()
          .from(appBrandingSettings)
          .where(eq(appBrandingSettings.id, newId as any))
          .limit(1);
        return created[0];
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

  // Stripe Settings Operations
  async getStripeSettings(): Promise<StripeSettings | undefined> {
    try {
      if (!isMySQL) {
        return {
          id: 'default',
          enabled: 0,
          publishableKey: '',
          secretKey: '',
          webhookSecret: '',
          currency: 'usd',
          testMode: 1,
           createdAt: new Date(),
          updatedAt: new Date(),
        } as StripeSettings;
      }

      const result = await db.select().from(stripeSettings).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting Stripe settings:", error);
      return undefined;
    }
  }

  async updateStripeSettings(settings: Partial<InsertStripeSettings>): Promise<StripeSettings> {
    try {
      const existing = await this.getStripeSettings();
  const now = new Date();

      if (existing) {
        const updated = await db
          .update(stripeSettings)
          .set({ ...settings, updatedAt: now })
          .where(eq(stripeSettings.id, existing.id))
          .returning();
        return updated[0];
      } else {
        const newSettings: InsertStripeSettings = {
          id: randomUUID(),
          enabled: 0,
          publishableKey: "",
          secretKey: "",
          webhookSecret: "",
          currency: "usd",
          testMode: 1,
          ...settings,
          createdAt: now,
          updatedAt: now,
        };
        const created = await db.insert(stripeSettings).values(newSettings).returning();
        return created[0];
      }
    } catch (error) {
      console.error("Error updating Stripe settings:", error);
      throw error;
    }
  }

  // Stripe Transaction Operations
  async createStripeTransaction(transaction: InsertStripeTransaction): Promise<StripeTransaction> {
    try {
  const now = new Date();
      const newTransaction: InsertStripeTransaction = {
        ...transaction,
        id: transaction.id || randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.insert(stripeTransactions).values(newTransaction).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating Stripe transaction:", error);
      throw error;
    }
  }

  async getStripeTransaction(id: string): Promise<StripeTransaction | undefined> {
    try {
      const result = await db
        .select()
        .from(stripeTransactions)
        .where(eq(stripeTransactions.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting Stripe transaction:", error);
      return undefined;
    }
  }

  async getStripeTransactionByPaymentIntent(paymentIntentId: string): Promise<StripeTransaction | undefined> {
    try {
      const result = await db
        .select()
        .from(stripeTransactions)
        .where(eq(stripeTransactions.stripePaymentIntentId, paymentIntentId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting Stripe transaction by payment intent:", error);
      return undefined;
    }
  }

  async updateStripeTransaction(
    id: string,
    transaction: Partial<InsertStripeTransaction>
  ): Promise<StripeTransaction | undefined> {
    try {
  const now = new Date();
      const updated = await db
        .update(stripeTransactions)
        .set({ ...transaction, updatedAt: now })
        .where(eq(stripeTransactions.id, id))
        .returning();
      return updated[0];
    } catch (error) {
      console.error("Error updating Stripe transaction:", error);
      return undefined;
    }
  }

  async getStripeTransactionsByPaymentId(paymentId: string): Promise<StripeTransaction[]> {
    try {
      return await db
        .select()
        .from(stripeTransactions)
        .where(eq(stripeTransactions.paymentId, paymentId));
    } catch (error) {
      console.error("Error getting Stripe transactions by payment ID:", error);
      return [];
    }
  }
}




export const storage = new DatabaseStorage();

// Exported helper so other modules (setup) can run the full DDL against a provided drizzle db instance
export async function createMySQLTablesUsingDb(dbInstance: any) {
  const results: Array<{ table: string; ok: boolean; error?: string }> = [];
  // helper to run a statement and record result
  const run = async (tableName: string, fn: () => Promise<any>) => {
    try {
      await fn();
      results.push({ table: tableName, ok: true });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : String(err);
      console.error(`Error creating table ${tableName}:`, msg);
      results.push({ table: tableName, ok: false, error: msg });
    }
  };

  // compatibility executor: Try common query methods depending on dbInstance type
  const execSql = async (sqlText: string) => {
    if (!dbInstance) throw new Error('No db instance provided');

    // Try the most likely APIs in order. Wrap each call in try/catch so that if one
    // method exists but behaves unexpectedly we still attempt the others.
    const errors: string[] = [];

    // 1) If the instance exposes a 'run' function (some wrappers), try it
    try {
      if (typeof (dbInstance as any).run === 'function') {
        return await (dbInstance as any).run(sqlText);
      }
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }

    // 2) mysql2 pool / connection .execute(sql, params?) -> returns [rows, fields]
    try {
      if (typeof (dbInstance as any).execute === 'function') {
        return await (dbInstance as any).execute(sqlText);
      }
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }

    // 3) mysql2 pool / connection .query(sql, params?)
    try {
      if (typeof (dbInstance as any).query === 'function') {
        return await (dbInstance as any).query(sqlText);
      }
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }

    // 4) Drizzle-like adapters may expose a `raw`/`executeSql` or be callable
    try {
      if (typeof (dbInstance as any).raw === 'function') {
        return await (dbInstance as any).raw(sqlText);
      }
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }

    try {
      if (typeof dbInstance === 'function') {
        return await (dbInstance as any)(sqlText);
      }
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }

    throw new Error('dbInstance does not support run/execute/query/raw/call — attempts: ' + errors.join(' | '));
  };

  console.log("🏗️ Running MySQL DDL (per-table results will be returned)");

  await run('users', async () => {
    await execSql(
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        email VARCHAR(255),
        password_change_required TINYINT(1) NOT NULL DEFAULT 1,
        theme VARCHAR(100) NOT NULL DEFAULT 'original',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`
    );
  });

  await run('beats', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS beats (
        id VARCHAR(36) PRIMARY KEY,
        title TEXT NOT NULL,
        producer TEXT NOT NULL,
        bpm INT NOT NULL,
        genre TEXT NOT NULL,
        price DOUBLE NOT NULL,
        image_url TEXT NOT NULL,
        audio_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('purchases', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        beat_id VARCHAR(36) NOT NULL,
        price DOUBLE NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (beat_id) REFERENCES beats(id)
      ) ENGINE=InnoDB;`);
  });

  await run('analytics', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(36) PRIMARY KEY,
        site_visits INT NOT NULL DEFAULT 0,
        total_downloads INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('customers', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;`);
  });

  await run('cart', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS cart (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        beat_id VARCHAR(36) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (beat_id) REFERENCES beats(id)
      ) ENGINE=InnoDB;`);
  });

  await run('payments', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        purchase_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        amount DOUBLE NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        transaction_id TEXT,
        bank_reference TEXT,
        notes TEXT,
        approved_by VARCHAR(36),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      ) ENGINE=InnoDB;`);
  });

  await run('genres', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS genres (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('verification_codes', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS verification_codes (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'password_reset',
        expires_at TIMESTAMP NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;`);
  });

  await run('email_settings', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS email_settings (
        id VARCHAR(36) PRIMARY KEY,
        enabled TINYINT(1) NOT NULL DEFAULT 0,
        smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
        smtp_port INT NOT NULL DEFAULT 587,
        smtp_secure TINYINT(1) NOT NULL DEFAULT 0,
        smtp_user TEXT NOT NULL DEFAULT '',
        smtp_pass TEXT NOT NULL DEFAULT '',
        from_name TEXT NOT NULL DEFAULT 'BeatBazaar',
        from_email TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('social_media_settings', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS social_media_settings (
        id VARCHAR(36) PRIMARY KEY,
        facebook_url TEXT NOT NULL DEFAULT '',
        instagram_url TEXT NOT NULL DEFAULT '',
        twitter_url TEXT NOT NULL DEFAULT '',
        youtube_url TEXT NOT NULL DEFAULT '',
        tiktok_url TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('contact_settings', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS contact_settings (
        id VARCHAR(36) PRIMARY KEY,
        band_image_url TEXT NOT NULL DEFAULT '',
        band_name TEXT NOT NULL DEFAULT 'BeatBazaar',
        contact_email TEXT NOT NULL DEFAULT 'contact@beatbazaar.com',
        contact_phone TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
        contact_address TEXT NOT NULL DEFAULT '123 Music Street',
        contact_city TEXT NOT NULL DEFAULT 'Los Angeles',
        contact_state TEXT NOT NULL DEFAULT 'CA',
        contact_zip_code TEXT NOT NULL DEFAULT '90210',
        contact_country TEXT NOT NULL DEFAULT 'USA',
        message_enabled TINYINT(1) NOT NULL DEFAULT 1,
        message_subject TEXT NOT NULL DEFAULT 'New Contact Form Submission',
        message_template TEXT NOT NULL DEFAULT 'You have received a new message from your contact form.',
        facebook_url TEXT NOT NULL DEFAULT '',
        instagram_url TEXT NOT NULL DEFAULT '',
        twitter_url TEXT NOT NULL DEFAULT '',
        youtube_url TEXT NOT NULL DEFAULT '',
        tiktok_url TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('artist_bios', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS artist_bios (
        id VARCHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Artist',
        social_links JSON NOT NULL DEFAULT '{}',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('plans_settings', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS plans_settings (
        id VARCHAR(36) PRIMARY KEY,
        page_title TEXT NOT NULL DEFAULT 'Beat Licensing Plans',
        page_subtitle TEXT NOT NULL DEFAULT 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.',
        basic_plan JSON NOT NULL DEFAULT '{"name":"Basic License","price":29}',
        premium_plan JSON NOT NULL DEFAULT '{"name":"Premium License","price":99}',
        exclusive_plan JSON NOT NULL DEFAULT '{"name":"Exclusive Rights","price":999}',
        additional_features_title TEXT NOT NULL DEFAULT 'Why Choose BeatBazaar?',
        additional_features JSON NOT NULL DEFAULT '[]',
        faq_section JSON NOT NULL DEFAULT '{}',
        trust_badges JSON NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('app_branding_settings', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS app_branding_settings (
        id VARCHAR(36) PRIMARY KEY,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  // Stripe tables
  await run('stripe_settings', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS stripe_settings (
        id VARCHAR(36) PRIMARY KEY,
        enabled TINYINT(1) NOT NULL DEFAULT 0,
        publishable_key TEXT NOT NULL DEFAULT '',
        secret_key TEXT NOT NULL DEFAULT '',
        webhook_secret TEXT NOT NULL DEFAULT '',
        currency TEXT NOT NULL DEFAULT 'usd',
        test_mode TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`);
  });

  await run('stripe_transactions', async () => {
    await execSql(`CREATE TABLE IF NOT EXISTS stripe_transactions (
        id VARCHAR(36) PRIMARY KEY,
        payment_id VARCHAR(36) NOT NULL,
        stripe_payment_intent_id TEXT NOT NULL UNIQUE,
        stripe_customer_id TEXT,
        amount DOUBLE NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        receipt_url TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id)
      ) ENGINE=InnoDB;`);
  });

  console.log("✅ MySQL DDL executed (per-table results available)");

  return results;
}

/**
 * Reinitialize the module-level DB connection using provided config.
 * This will replace the running `db` adapter and mark the runtime as MySQL.
 * It also runs the full DDL and calls storage.onDatabaseReady() to finish bootstrapping.
 */
export async function reinitializeDatabase(cfg: { host: string; port?: number | string; user: string; password?: string; database: string }) {
  try {
    const pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port ? Number(cfg.port) : 3306,
      user: cfg.user,
      password: cfg.password || '',
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 5,
    } as any);

  // replace module-level db (Drizzle adapter) so the rest of the app can use it
  db = drizzleMysql(pool as any);
  isMySQL = true;

  // create tables using the raw pool when possible — mysql2 pool has execute/query which
  // will work reliably for DDL. Passing the pool avoids adapter-specific method differences.
  const results = await createMySQLTablesUsingDb(pool as any);

    // run storage-level bootstrapping
    try {
      await (storage as DatabaseStorage).onDatabaseReady();
    } catch (e) {
      console.error('Error running storage.onDatabaseReady:', e);
    }

    // do not end the pool: we want the server to keep using it
    return { ok: true, results };
  } catch (error) {
    console.error('reinitializeDatabase error:', error);
    throw error;
  }
}