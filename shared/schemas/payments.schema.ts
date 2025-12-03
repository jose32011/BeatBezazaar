import { pgTable, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { purchases } from "./purchases.schema";
import { customers } from "./customers.schema";
import { users } from "./users.schema";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseId: text("purchase_id").notNull().references(() => purchases.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  amount: doublePrecision("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'paypal', 'bank_transfer', 'credit_card'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'completed'
  transactionId: text("transaction_id"),
  bankReference: text("bank_reference"),
  notes: text("notes"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be a positive number"),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
