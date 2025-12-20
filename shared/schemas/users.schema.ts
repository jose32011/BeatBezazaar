import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // 'admin' or 'client'
  email: text("email"),
  passwordChangeRequired: boolean("password_change_required").notNull().default(true),
  theme: text("theme").notNull().default("original"),
  currentPlan: text("currentPlan").notNull().default("basic"), // 'basic', 'premium', 'exclusive'
  planStatus: text("planStatus").notNull().default("active"), // 'active', 'cancelled', 'expired'
  planStartDate: timestamp("planStartDate").defaultNow(),
  planEndDate: timestamp("planEndDate"), // null for lifetime plans
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
