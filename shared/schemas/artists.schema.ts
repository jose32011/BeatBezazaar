import { pgTable, text, boolean, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';

export const artistBios = pgTable("artist_bios", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  bio: text("bio").notNull(),
  role: text("role").notNull().default("Artist"), // e.g., "Producer", "Singer", "Rapper", etc.
  socialLinks: json("social_links").$type<{
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  }>().notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertArtistBioSchema = createInsertSchema(artistBios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArtistBio = typeof artistBios.$inferInsert;
export type ArtistBio = typeof artistBios.$inferSelect;
