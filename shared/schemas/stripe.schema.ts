import { pgTable, text, boolean, doublePrecision, timestamp, json } from "drizzle-orm/pg-core";
import { payments } from "./payments.schema";

// Stripe Settings Table
export const stripeSettings = pgTable("stripe_settings", {
  id: text("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false), // false = disabled, true = enabled
  publishableKey: text("publishable_key").notNull().default(""),
  secretKey: text("secret_key").notNull().default(""),
  webhookSecret: text("webhook_secret").notNull().default(""),
  currency: text("currency").notNull().default("usd"),
  testMode: boolean("test_mode").notNull().default(true), // false = live, true = test
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type StripeSettings = typeof stripeSettings.$inferSelect;
export type InsertStripeSettings = typeof stripeSettings.$inferInsert;

// Stripe Transactions Table (for tracking Stripe payments)
export const stripeTransactions = pgTable("stripe_transactions", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id").notNull().references(() => payments.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, canceled
  paymentMethod: text("payment_method"), // card, bank_transfer, etc.
  receiptUrl: text("receipt_url"),
  metadata: json("metadata"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type StripeTransaction = typeof stripeTransactions.$inferSelect;
export type InsertStripeTransaction = typeof stripeTransactions.$inferInsert;
