import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';

export const analytics = pgTable("analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  siteVisits: integer("site_visits").notNull().default(0),
  totalDownloads: integer("total_downloads").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  updatedAt: true,
});

export type InsertAnalytics = typeof analytics.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
