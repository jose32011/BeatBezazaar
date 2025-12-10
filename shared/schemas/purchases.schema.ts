import { pgTable, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const purchases = pgTable("purchases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  beatId: text("beat_id").notNull(),
  beatTitle: text("beat_title"),
  beatProducer: text("beat_producer"),
  beatAudioUrl: text("beat_audio_url"), // Store original audio URL before deletion
  beatImageUrl: text("beat_image_url"), // Store original image URL before deletion
  price: doublePrecision("price").notNull(),
  isExclusive: text("is_exclusive").default("false").notNull(),
  status: text("status").default("completed").notNull(), // 'pending', 'approved', 'completed', 'rejected'
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  notes: text("notes"), // Admin notes about the purchase
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
}).extend({
  price: z.coerce.number().positive("Price must be a positive number"),
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;
