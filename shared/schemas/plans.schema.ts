import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';

export const plansSettings = pgTable("plans_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageTitle: text("page_title").notNull().default("Beat Licensing Plans"),
  pageSubtitle: text("page_subtitle").notNull().default("Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership."),
  basicPlan: json("basic_plan").$type<{
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
  }>().notNull(),
  premiumPlan: json("premium_plan").$type<{
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
  }>().notNull(),
  exclusivePlan: json("exclusive_plan").$type<{
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
  }>().notNull(),
  additionalFeaturesTitle: text("additional_features_title").notNull().default("Why Choose BeatBazaar?"),
  additionalFeatures: json("additional_features").$type<{
    title: string;
    description: string;
    icon: string;
  }[]>().notNull(),
  faqSection: json("faq_section").$type<{
    title: string;
    questions: {
      question: string;
      answer: string;
    }[];
  }>().notNull(),
  trustBadges: json("trust_badges").$type<{
    text: string;
    icon: string;
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlansSettingsSchema = createInsertSchema(plansSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlansSettings = typeof plansSettings.$inferInsert;
export type PlansSettings = typeof plansSettings.$inferSelect;
