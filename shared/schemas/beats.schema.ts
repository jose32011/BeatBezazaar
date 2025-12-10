import { pgTable, text, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const beats = pgTable("beats", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  producer: text("producer").notNull(),
  bpm: integer("bpm").notNull(),
  genre: text("genre").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
  audioUrl: text("audio_url"),
  isExclusive: boolean("is_exclusive").default(false).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBeatSchema = createInsertSchema(beats).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.coerce.number().positive("Price must be a positive number"),
  bpm: z.coerce.number().int().positive("BPM must be a positive integer"),
});

export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type Beat = typeof beats.$inferSelect;
