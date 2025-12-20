import { pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const exclusivePurchases = pgTable("exclusive_purchases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  beatId: text("beat_id").notNull(),
  price: doublePrecision("price").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'completed'
  adminNotes: text("admin_notes"),
  paymentMethod: text("payment_method"), // 'stripe', 'paypal', 'manual'
  paymentId: text("payment_id"), // Reference to payment record
  approvedBy: text("approved_by"), // Admin user ID who approved
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExclusivePurchaseSchema = createInsertSchema(exclusivePurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExclusivePurchase = z.infer<typeof insertExclusivePurchaseSchema>;
export type ExclusivePurchase = typeof exclusivePurchases.$inferSelect;