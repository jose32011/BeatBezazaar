import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { beats } from "./beats.schema";
import { createInsertSchema } from 'drizzle-zod';

export const cart = pgTable("cart", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  beatId: text("beat_id").notNull().references(() => beats.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  addedAt: true,
});

export type InsertCart = typeof cart.$inferInsert;
export type Cart = typeof cart.$inferSelect;
