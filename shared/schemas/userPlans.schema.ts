import { pgTable, text, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const userPlans = pgTable("user_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  plan: text("plan").notNull(), // 'basic', 'premium', 'exclusive'
  status: text("status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"), // null for lifetime plans
  isLifetime: boolean("is_lifetime").default(false).notNull(),
  paymentAmount: doublePrecision("payment_amount"),
  paymentMethod: text("payment_method"), // 'stripe', 'paypal', 'manual'
  stripeSubscriptionId: text("stripe_subscription_id"),
  paypalSubscriptionId: text("paypal_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserPlanSchema = createInsertSchema(userPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type UserPlan = typeof userPlans.$inferSelect;