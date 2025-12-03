import { pgTable, text, boolean, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';

// Email Settings
export const emailSettings = pgTable("email_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  enabled: boolean("enabled").notNull().default(false),
  smtpHost: text("smtp_host").notNull().default("smtp.gmail.com"),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPass: text("smtp_pass").notNull().default(""),
  fromName: text("from_name").notNull().default("BeatBazaar"),
  fromEmail: text("from_email").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailSettings = typeof emailSettings.$inferInsert;
export type EmailSettings = typeof emailSettings.$inferSelect;

// Social Media Settings
export const socialMediaSettings = pgTable("social_media_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  facebookUrl: text("facebook_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  tiktokUrl: text("tiktok_url").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSocialMediaSettingsSchema = createInsertSchema(socialMediaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocialMediaSettings = typeof socialMediaSettings.$inferInsert;
export type SocialMediaSettings = typeof socialMediaSettings.$inferSelect;

// Contact Settings
export const contactSettings = pgTable("contact_settings", {
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
  messageEnabled: boolean("message_enabled").notNull().default(true),
  messageSubject: text("message_subject").notNull().default("New Contact Form Submission"),
  messageTemplate: text("message_template").notNull().default("You have received a new message from your contact form."),
  facebookUrl: text("facebook_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  tiktokUrl: text("tiktok_url").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSettingsSchema = createInsertSchema(contactSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContactSettings = typeof contactSettings.$inferInsert;
export type ContactSettings = typeof contactSettings.$inferSelect;

// App Branding Settings
export const appBrandingSettings = pgTable("app_branding_settings", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppBrandingSettingsSchema = createInsertSchema(appBrandingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppBrandingSettings = typeof appBrandingSettings.$inferInsert;
export type AppBrandingSettings = typeof appBrandingSettings.$inferSelect;
