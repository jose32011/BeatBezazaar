# Database Clear Utilities

This project includes flexible database clearing utilities to help with development, testing, and maintenance.

## Available Scripts

### Interactive Mode
```bash
npm run db:clear
# or
node clear-database.js
```
- **Interactive menu** to select specific tables or files to clear
- **Confirmation prompts** to prevent accidental data loss
- **Detailed descriptions** of each table and its purpose

### Quick Mode (Command Line)
```bash
# Clear everything (database + files)
npm run db:clear:all
node clear-database-quick.js --all

# Clear all database tables only (keep files)
npm run db:clear:database
node clear-database-quick.js --database

# Clear upload files only (keep database)
npm run db:clear:files
node clear-database-quick.js --files

# Clear specific tables
node clear-database-quick.js --tables users,beats,cart
```

## Available Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts and authentication |
| `beats` | Beat/track data and metadata |
| `genres` | Music genre categories |
| `purchases` | Purchase history and transactions |
| `customers` | Customer information and profiles |
| `cart` | Shopping cart items |
| `payments` | Payment records and processing |
| `analytics` | Usage analytics and statistics |
| `verification` | Email verification tokens |
| `settings` | Application settings and configuration |
| `artists` | Artist profiles and information |
| `plans` | Subscription plans and pricing |
| `stripe_customers` | Stripe customer data |
| `home_settings` | Homepage customization settings |

## File Storage

The utilities can also clear uploaded files:
- **Audio files**: `uploads/audio/` - Beat audio files
- **Image files**: `uploads/images/` - Album art and profile images

## Usage Examples

### Development Workflow
```bash
# Clear test data but keep user accounts
node clear-database-quick.js --tables cart,purchases,payments

# Reset everything for fresh start
npm run db:clear:all

# Clear only user-generated content
node clear-database-quick.js --tables beats,purchases,cart --files
```

### Testing
```bash
# Clear analytics and verification data
node clear-database-quick.js --tables analytics,verification

# Reset cart and payment data
node clear-database-quick.js --tables cart,payments
```

### Maintenance
```bash
# Clear old upload files only
npm run db:clear:files

# Interactive mode for careful selection
npm run db:clear
```

## Safety Features

- **Confirmation prompts** in interactive mode
- **Foreign key constraints** temporarily disabled during clearing
- **Table existence checks** - skips non-existent tables gracefully
- **Clear error messages** and status updates
- **Automatic admin user recreation** notice when users table is cleared

## Important Notes

⚠️ **Data Loss Warning**: These operations permanently delete data and cannot be undone.

📝 **Admin User**: When the `users` table is cleared, you'll need to restart the server to recreate the admin user.

🔄 **Server Restart**: After clearing user-related data, restart the development server for proper initialization.

## Interactive Mode Features

The interactive mode (`npm run db:clear`) provides:

1. **Table Selection Menu**: Choose specific tables with descriptions
2. **File Clearing Option**: Select upload files separately
3. **Quick Options**: 
   - Clear everything
   - Clear database only
   - Clear files only
4. **Confirmation Steps**: Multiple confirmations prevent accidents
5. **Progress Feedback**: Real-time status updates during clearing

## Command Line Options

The quick mode supports these flags:

- `--all`: Clear everything (database + files)
- `--database`: Clear all database tables only
- `--files`: Clear upload files only  
- `--tables <list>`: Clear specific tables (comma-separated)
- `--help`: Show usage information

## Integration with Development

These utilities integrate seamlessly with your development workflow:

- Use before running tests to ensure clean state
- Clear specific data types during feature development
- Reset demo data for presentations
- Clean up after testing payment flows
- Remove test uploads and user accounts