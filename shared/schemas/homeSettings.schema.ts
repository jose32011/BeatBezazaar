import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const homeSettings = pgTable("home_settings", {
  id: text("id").primaryKey().default("default"),
  title: text("title").notNull().default("Premium Beats for Your Next Hit"),
  description: text("description").notNull().default("Discover high-quality beats crafted by professional producers."),
  feature1: text("feature1").notNull().default("Instant download after purchase"),
  feature2: text("feature2").notNull().default("High-quality WAV & MP3 files"),
  feature3: text("feature3").notNull().default("Professional mixing and mastering"),
  imageUrl: text("image_url").notNull().default("https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type HomeSettings = typeof homeSettings.$inferSelect;
export type NewHomeSettings = typeof homeSettings.$inferInsert;
