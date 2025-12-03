# Database Schema Organization

## 📁 New Modular Structure

The database schema has been reorganized into separate, focused files for better maintainability and readability.

### Directory Structure

```
shared/
├── schema.ts                          # Main export (backward compatible)
└── schemas/
    ├── README.md                      # Documentation
    ├── index.ts                       # Central export file
    │
    ├── users.schema.ts                # 👤 User Management
    ├── beats.schema.ts                # 🎵 Music Beats
    ├── genres.schema.ts               # 🎸 Music Genres
    │
    ├── purchases.schema.ts            # 💰 Purchases
    ├── customers.schema.ts            # 👥 Customer Info
    ├── cart.schema.ts                 # 🛒 Shopping Cart
    ├── payments.schema.ts             # 💳 Payments
    │
    ├── analytics.schema.ts            # 📊 Analytics
    ├── verification.schema.ts         # ✉️ Verification Codes
    ├── artists.schema.ts              # 🎤 Artist Bios
    │
    ├── settings.schema.ts             # ⚙️ App Settings
    ├── plans.schema.ts                # 📋 Licensing Plans
    └── stripe.schema.ts               # 💵 Stripe Integration
```

## 📊 Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     Core Entities                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐   │
│  │  Users   │────────▶│ Customers│────────▶│ Payments │   │
│  └──────────┘         └──────────┘         └──────────┘   │
│       │                     │                     │         │
│       │                     │                     │         │
│       ▼                     │                     ▼         │
│  ┌──────────┐              │              ┌──────────┐   │
│  │   Cart   │              │              │Purchases │   │
│  └──────────┘              │              └──────────┘   │
│       │                     │                     │         │
│       │                     │                     │         │
│       ▼                     │                     │         │
│  ┌──────────┐              │                     │         │
│  │  Beats   │◀─────────────┘                     │         │
│  └──────────┘◀───────────────────────────────────┘         │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                              │
│  │  Genres  │                                              │
│  └──────────┘                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Supporting Tables                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Verification │  │  Analytics   │  │ Artist Bios  │    │
│  │    Codes     │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Settings & Configuration                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Email     │  │Social Media  │  │   Contact    │    │
│  │   Settings   │  │   Settings   │  │   Settings   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ App Branding │  │    Plans     │  │   Stripe     │    │
│  │   Settings   │  │   Settings   │  │   Settings   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📝 File Contents

### Core Business Logic

| File | Tables | Purpose |
|------|--------|---------|
| `users.schema.ts` | users | User accounts, authentication, roles |
| `beats.schema.ts` | beats | Music tracks with metadata (BPM, genre, price) |
| `genres.schema.ts` | genres | Music genre categories |
| `purchases.schema.ts` | purchases | Purchase transaction records |
| `customers.schema.ts` | customers | Customer profile information |
| `cart.schema.ts` | cart | Shopping cart items |
| `payments.schema.ts` | payments | Payment processing and status |

### Supporting Features

| File | Tables | Purpose |
|------|--------|---------|
| `analytics.schema.ts` | analytics | Site visits and download tracking |
| `verification.schema.ts` | verification_codes | Email/password reset codes |
| `artists.schema.ts` | artist_bios | Artist biographies and social links |

### Configuration

| File | Tables | Purpose |
|------|--------|---------|
| `settings.schema.ts` | email_settings<br>social_media_settings<br>contact_settings<br>app_branding_settings | All app configuration in one file |
| `plans.schema.ts` | plans_settings | Licensing plan configurations (JSON) |
| `stripe.schema.ts` | stripe_settings<br>stripe_transactions | Stripe payment integration |

## 🔄 Migration from Old Structure

### Before (Single File)
```typescript
// shared/schema.ts - 500+ lines
import { pgTable, text, ... } from "drizzle-orm/pg-core";

export const users = pgTable("users", { ... });
export const beats = pgTable("beats", { ... });
export const genres = pgTable("genres", { ... });
// ... 15+ more tables
```

### After (Modular)
```typescript
// shared/schemas/users.schema.ts - ~30 lines
import { pgTable, text, ... } from "drizzle-orm/pg-core";
export const users = pgTable("users", { ... });

// shared/schemas/beats.schema.ts - ~30 lines
import { pgTable, text, ... } from "drizzle-orm/pg-core";
export const beats = pgTable("beats", { ... });

// shared/schema.ts - 1 line (backward compatible)
export * from './schemas';
```

## ✅ Benefits

1. **Easier to Navigate** - Find tables quickly by file name
2. **Better Organization** - Related tables grouped logically
3. **Reduced Complexity** - Each file is small and focused
4. **Improved Collaboration** - Less merge conflicts
5. **Backward Compatible** - Existing imports still work
6. **Better IDE Support** - Faster autocomplete and navigation

## 🚀 Usage Examples

### Import Everything (Old Way - Still Works)
```typescript
import { users, beats, genres } from '@shared/schema';
```

### Import Specific Schema (New Way)
```typescript
import { users, User, InsertUser } from '@shared/schemas/users.schema';
import { beats, Beat, InsertBeat } from '@shared/schemas/beats.schema';
```

### Import Multiple Schemas
```typescript
import { users } from '@shared/schemas/users.schema';
import { beats } from '@shared/schemas/beats.schema';
import { genres } from '@shared/schemas/genres.schema';
```

## 📦 What's Included in Each File

Each schema file typically includes:
- Table definition using Drizzle ORM
- Zod validation schemas
- TypeScript types for insert and select operations
- Proper foreign key relationships

Example:
```typescript
// Table definition
export const users = pgTable("users", { ... });

// Validation schema
export const insertUserSchema = createInsertSchema(users);

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

## 🔧 Development Workflow

1. **Modify a schema**: Edit the specific `.schema.ts` file
2. **Push changes**: Run `npm run db:push`
3. **Use in code**: Import from `@shared/schema` or specific file

## 📚 Documentation

See `shared/schemas/README.md` for detailed documentation on:
- Adding new schemas
- Schema file structure
- Best practices
- Examples

---

**Result**: Clean, organized, maintainable database schema! 🎉
