import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const verificationCodes = pgTable("verification_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  type: text("type").notNull().default("password_reset"), // 'password_reset', 'email_verification'
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = typeof verificationCodes.$inferInsert;
