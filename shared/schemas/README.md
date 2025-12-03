# Database Schema Organization

This directory contains the PostgreSQL database schema organized into logical, maintainable files.

## Structure

```
shared/schemas/
├── index.ts                 # Main export file
├── users.schema.ts          # User accounts and authentication
├── beats.schema.ts          # Music beats/tracks
├── genres.schema.ts         # Music genres
├── purchases.schema.ts      # Purchase records
├── customers.schema.ts      # Customer information
├── cart.schema.ts           # Shopping cart
├── payments.schema.ts       # Payment transactions
├── analytics.schema.ts      # Site analytics
├── verification.schema.ts   # Email/password verification codes
├── settings.schema.ts       # App settings (email, social, contact, branding)
├── artists.schema.ts        # Artist biographies
├── plans.schema.ts          # Licensing plans
└── stripe.schema.ts         # Stripe payment integration
```

## Usage

Import from the main schema file (maintains backward compatibility):

```typescript
import { users, beats, genres } from '@shared/schema';
```

Or import directly from specific schema files:

```typescript
import { users, User, InsertUser } from '@shared/schemas/users.schema';
import { beats, Beat, InsertBeat } from '@shared/schemas/beats.schema';
```

## Schema Files

### Core Entities

- **users.schema.ts** - User accounts with authentication
- **beats.schema.ts** - Music beats/tracks with metadata
- **genres.schema.ts** - Music genre categories
- **purchases.schema.ts** - Purchase transaction records
- **customers.schema.ts** - Customer profile information
- **cart.schema.ts** - Shopping cart items
- **payments.schema.ts** - Payment processing records

### Supporting Tables

- **analytics.schema.ts** - Site visit and download tracking
- **verification.schema.ts** - Email and password reset codes
- **artists.schema.ts** - Artist biography and social links

### Settings & Configuration

- **settings.schema.ts** - Contains:
  - Email settings (SMTP configuration)
  - Social media links
  - Contact information
  - App branding (logos, hero images, etc.)

- **plans.schema.ts** - Licensing plan configurations with JSON data
- **stripe.schema.ts** - Stripe payment gateway settings and transactions

## Benefits of This Structure

1. **Maintainability** - Each schema file is focused and easy to understand
2. **Readability** - Smaller files are easier to navigate
3. **Reusability** - Import only what you need
4. **Organization** - Logical grouping of related tables
5. **Backward Compatible** - Existing imports still work via `shared/schema.ts`

## Adding New Schemas

1. Create a new file: `shared/schemas/your-table.schema.ts`
2. Define your table using Drizzle ORM
3. Export types and schemas
4. Add export to `shared/schemas/index.ts`
5. Run `npm run db:push` to update the database

## Example Schema File

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';

export const yourTable = pgTable("your_table", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertYourTableSchema = createInsertSchema(yourTable).omit({
  id: true,
  createdAt: true,
});

export type InsertYourTable = typeof yourTable.$inferInsert;
export type YourTable = typeof yourTable.$inferSelect;
```

## Database Migrations

After modifying schemas, push changes to PostgreSQL:

```bash
npm run db:push
```

This will sync your schema changes with the database.
