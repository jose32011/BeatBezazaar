import { sql } from "drizzle-orm";

import { integer, sqliteTable, text, real, primaryKey, pgTable, boolean, timestamp,  } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Stripe Settings Table
export const stripeSettings = sqliteTable("stripe_settings", {
  id: text("id").primaryKey(),
  enabled: integer("enabled").notNull().default(0), // 0 = disabled, 1 = enabled
  publishableKey: text("publishable_key").notNull().default(""),
  secretKey: text("secret_key").notNull().default(""),
  webhookSecret: text("webhook_secret").notNull().default(""),
  currency: text("currency").notNull().default("usd"),
  testMode: integer("test_mode").notNull().default(1), // 0 = live, 1 = test
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export type StripeSettings = typeof stripeSettings.$inferSelect;
export type InsertStripeSettings = typeof stripeSettings.$inferInsert;

// Stripe Transactions Table (for tracking Stripe payments)
export const stripeTransactions = sqliteTable("stripe_transactions", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id").notNull().references(() => payments.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, canceled
  paymentMethod: text("payment_method"), // card, bank_transfer, etc.
  receiptUrl: text("receipt_url"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export type StripeTransaction = typeof stripeTransactions.$inferSelect;
export type InsertStripeTransaction = typeof stripeTransactions.$inferInsert;


export const genres = sqliteTable("genres", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#3b82f6"),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertGenreSchema = createInsertSchema(genres);
export const selectGenreSchema = createSelectSchema(genres);

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // 'admin' or 'client'
  email: text("email"),
  passwordChangeRequired: integer("password_change_required", { mode: "boolean" }).notNull().default(true),
  theme: text("theme").notNull().default("original"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const beats = sqliteTable("beats", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  producer: text("producer").notNull(),
  bpm: integer("bpm").notNull(),
  genre: text("genre").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  audioUrl: text("audio_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const purchases = sqliteTable("purchases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  beatId: text("beat_id").notNull(),
  price: real("price").notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const analytics = sqliteTable("analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  siteVisits: integer("site_visits").notNull().default(0),
  totalDownloads: integer("total_downloads").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cart = sqliteTable("cart", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  beatId: text("beat_id").notNull().references(() => beats.id),
  addedAt: integer("added_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseId: text("purchase_id").notNull().references(() => purchases.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'paypal', 'bank_transfer', 'credit_card'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'completed'
  transactionId: text("transaction_id"),
  bankReference: text("bank_reference"),
  notes: text("notes"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const verificationCodes = sqliteTable("verification_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  type: text("type").notNull().default("password_reset"), // 'password_reset', 'email_verification'
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emailSettings = sqliteTable("email_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  smtpHost: text("smtp_host").notNull().default("smtp.gmail.com"),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: integer("smtp_secure", { mode: "boolean" }).notNull().default(false),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPass: text("smtp_pass").notNull().default(""),
  fromName: text("from_name").notNull().default("BeatBazaar"),
  fromEmail: text("from_email").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const socialMediaSettings = sqliteTable("social_media_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  facebookUrl: text("facebook_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  tiktokUrl: text("tiktok_url").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const contactSettings = sqliteTable("contact_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bandImageUrl: text("band_image_url").notNull().default(""),
  bandName: text("band_name").notNull().default("BeatBazaar"),
  contactEmail: text("contact_email").notNull().default("contact@beatbazaar.com"),
  contactPhone: text("contact_phone").notNull().default("+1 (555) 123-4567"),
  contactAddress: text("contact_address").notNull().default("123 Music Street"),
  contactCity: text("contact_city").notNull().default("Los Angeles"),
  contactState: text("contact_state").notNull().default("CA"),
  contactZipCode: text("contact_zip_code").notNull().default("90210"),
  contactCountry: text("contact_country").notNull().default("USA"),
  messageEnabled: integer("message_enabled", { mode: "boolean" }).notNull().default(true),
  messageSubject: text("message_subject").notNull().default("New Contact Form Submission"),
  messageTemplate: text("message_template").notNull().default("You have received a new message from your contact form."),
  // Social Media Settings
  facebookUrl: text("facebook_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  tiktokUrl: text("tiktok_url").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const artistBios = sqliteTable("artist_bios", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  bio: text("bio").notNull(),
  role: text("role").notNull().default("Artist"), // e.g., "Producer", "Singer", "Rapper", etc.
  socialLinks: text("social_links", { mode: "json" }).$type<{
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  }>().notNull().default({}),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const plansSettings = sqliteTable("plans_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageTitle: text("page_title").notNull().default("Beat Licensing Plans"),
  pageSubtitle: text("page_subtitle").notNull().default("Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership."),
  basicPlan: text("basic_plan", { mode: "json" }).$type<{
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
  }>().notNull().default({
    name: "Basic License",
    price: 29,
    description: "Perfect for independent artists and small projects",
    features: [
      "Commercial use rights",
      "Up to 5,000 copies",
      "Streaming on all platforms",
      "Radio play up to 1M listeners",
      "Music video rights",
      "Social media promotion",
      "1 year license term",
      "Email support"
    ],
    isActive: true
  }),
  premiumPlan: text("premium_plan", { mode: "json" }).$type<{
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
  }>().notNull().default({
    name: "Premium License",
    price: 99,
    description: "Ideal for established artists and larger projects",
    features: [
      "Everything in Basic License",
      "Up to 50,000 copies",
      "Radio play unlimited",
      "TV and film synchronization",
      "Live performance rights",
      "Remix and adaptation rights",
      "Priority support",
      "3 year license term",
      "Custom contract available"
    ],
    isActive: true,
    isPopular: true
  }),
  exclusivePlan: text("exclusive_plan", { mode: "json" }).$type<{
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
  }>().notNull().default({
    name: "Exclusive Rights",
    price: 999,
    description: "Complete ownership and exclusive rights to the beat",
    features: [
      "Complete ownership of the beat",
      "Unlimited commercial use",
      "Unlimited copies and streams",
      "Full publishing rights",
      "Master recording ownership",
      "Exclusive to you forever",
      "No attribution required",
      "Priority support",
      "Custom contract",
      "Beat removed from store",
      "Stems and project files included"
    ],
    isActive: true
  }),
  additionalFeaturesTitle: text("additional_features_title").notNull().default("Why Choose BeatBazaar?"),
  additionalFeatures: text("additional_features", { mode: "json" }).$type<{
    title: string;
    description: string;
    icon: string;
  }[]>().notNull().default([
    {
      title: "Legal Protection",
      description: "All licenses come with legal documentation and protection",
      icon: "Shield"
    },
    {
      title: "Artist Support",
      description: "Dedicated support team to help with your music career",
      icon: "Users"
    },
    {
      title: "Instant Download",
      description: "Get your beats immediately after purchase",
      icon: "Download"
    },
    {
      title: "High Quality",
      description: "Professional studio quality beats and stems",
      icon: "Headphones"
    }
  ]),
  faqSection: text("faq_section", { mode: "json" }).$type<{
    title: string;
    questions: {
      question: string;
      answer: string;
    }[];
  }>().notNull().default({
    title: "Frequently Asked Questions",
    questions: [
      {
        question: "What's the difference between Basic and Premium licenses?",
        answer: "Basic licenses are perfect for independent artists with limited distribution. Premium licenses offer higher copy limits, TV/film rights, and longer terms for established artists."
      },
      {
        question: "What does Exclusive Rights mean?",
        answer: "With exclusive rights, you own the beat completely. It's removed from our store, you get all stems and project files, and no one else can use it. You have full creative and commercial control."
      },
      {
        question: "Do I need to credit the producer?",
        answer: "For Basic and Premium licenses, crediting is appreciated but not required. With Exclusive Rights, no attribution is needed as you own the beat completely."
      }
    ]
  }),
  trustBadges: text("trust_badges", { mode: "json" }).$type<{
    text: string;
    icon: string;
  }[]>().notNull().default([
    {
      text: "Legal Protection Included",
      icon: "Shield"
    },
    {
      text: "Instant Download",
      icon: "Zap"
    },
    {
      text: "24/7 Support",
      icon: "Users"
    }
  ]),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// App Branding Settings
export const appBrandingSettings = sqliteTable("app_branding_settings", {
  id: text("id").primaryKey().$defaultFn(() => `app-branding-${Date.now()}`),
  appName: text("app_name").notNull().default("BeatBazaar"),
  appLogo: text("app_logo").notNull().default(""),
  heroTitle: text("hero_title").notNull().default("Discover Your Sound"),
  heroSubtitle: text("hero_subtitle").notNull().default("Premium beats for every artist. Find your perfect sound and bring your music to life."),
  heroImage: text("hero_image").notNull().default(""),
  heroButtonText: text("hero_button_text").notNull().default("Start Creating"),
  heroButtonLink: text("hero_button_link").notNull().default("/beats"),
  loginTitle: text("login_title").notNull().default("Welcome Back"),
  loginSubtitle: text("login_subtitle").notNull().default("Sign in to your account to continue"),
  loginImage: text("login_image").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertBeatSchema = createInsertSchema(beats).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.coerce.number().positive("Price must be a positive number"),
  bpm: z.coerce.number().int().positive("BPM must be a positive integer"),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
}).extend({
  price: z.coerce.number().positive("Price must be a positive number"),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  addedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be a positive number"),
});



export const insertSocialMediaSettingsSchema = createInsertSchema(socialMediaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSettingsSchema = createInsertSchema(contactSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtistBioSchema = createInsertSchema(artistBios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlansSettingsSchema = createInsertSchema(plansSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppBrandingSettingsSchema = createInsertSchema(appBrandingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type Beat = typeof beats.$inferSelect;

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof cart.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertSocialMediaSettings = z.infer<typeof insertSocialMediaSettingsSchema>;
export type SocialMediaSettings = typeof socialMediaSettings.$inferSelect;

export type InsertContactSettings = z.infer<typeof insertContactSettingsSchema>;
export type ContactSettings = typeof contactSettings.$inferSelect;

export type InsertArtistBio = z.infer<typeof insertArtistBioSchema>;
export type ArtistBio = typeof artistBios.$inferSelect;

export type InsertPlansSettings = z.infer<typeof insertPlansSettingsSchema>;
export type PlansSettings = typeof plansSettings.$inferSelect;

export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;

export type InsertAppBrandingSettings = z.infer<typeof insertAppBrandingSettingsSchema>;
export type AppBrandingSettings = typeof appBrandingSettings.$inferSelect;
