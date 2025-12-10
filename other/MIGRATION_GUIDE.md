# Database Migration Guide

## Overview
This guide covers running database migrations for new features added to BeatBazaar.

## Available Migrations

### 1. Exclusive Purchase Feature
**File**: `migrate-exclusive-purchases.js`

**What it does**:
- Adds `beat_audio_url`, `beat_image_url`, `notes` columns to `purchases` table
- Adds `is_exclusive`, `is_hidden` columns to `beats` table

**When to run**: Required for the exclusive purchase feature to work

**Command**:
```bash
node migrate-exclusive-purchases.js
```

### 2. Home Settings Feature
**File**: `migrate-home-settings.js`

**What it does**:
- Creates `home_settings` table
- Inserts default home page settings

**When to run**: Required for home page customization feature

**Command**:
```bash
node migrate-home-settings.js
```

## Running Migrations

### Prerequisites
1. Ensure your `.env` file has the correct `DATABASE_URL`
2. Database server must be running
3. You must have write permissions to the database

### Step-by-Step Process

1. **Backup your database first** (always!)
   ```bash
   # PostgreSQL backup
   pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
   ```

2. **Run the migration**
   ```bash
   node migrate-exclusive-purchases.js
   node migrate-home-settings.js
   ```

3. **Verify the migration**
   - Check the console output for success messages
   - Look for any error messages
   - Verify columns were added correctly

4. **Test the application**
   - Restart your server
   - Test the new features
   - Check for any errors in the console

### Run All Migrations at Once

```bash
node migrate-exclusive-purchases.js && node migrate-home-settings.js
```

## Migration Output

### Successful Migration
```
🔄 Starting exclusive purchase migration...

📋 Step 1: Adding new columns to purchases table...
✅ Added beat_audio_url column
✅ Added beat_image_url column
✅ Added notes column

📋 Step 2: Adding new columns to beats table...
✅ Added is_exclusive column
✅ Added is_hidden column

📋 Step 3: Verifying columns...

Purchases table columns:
  ✓ beat_audio_url (text)
  ✓ beat_image_url (text)
  ✓ notes (text)

Beats table columns:
  ✓ is_exclusive (boolean)
  ✓ is_hidden (boolean)

✅ Migration completed successfully!
```

### If Columns Already Exist
The migrations use `IF NOT EXISTS` and `ON CONFLICT` clauses, so they're safe to run multiple times:
```
⚠️  beat_audio_url column may already exist: column "beat_audio_url" of relation "purchases" already exists
```
This is normal and not an error.

## Troubleshooting

### Error: DATABASE_URL not found
**Problem**: `.env` file is missing or doesn't have DATABASE_URL

**Solution**:
1. Check that `.env` file exists in the project root
2. Verify it contains: `DATABASE_URL=postgresql://user:password@host:port/database`
3. Make sure there are no typos

### Error: Connection refused
**Problem**: Database server is not running

**Solution**:
1. Start your PostgreSQL server
2. Verify connection with: `psql -U username -d database_name`

### Error: Permission denied
**Problem**: User doesn't have permission to alter tables

**Solution**:
1. Use a database user with ALTER TABLE permissions
2. Or run as database superuser

### Error: Column already exists
**Problem**: Migration was already run

**Solution**:
- This is usually safe to ignore
- The migration will skip existing columns
- Check the verification step to confirm all columns exist

## Rollback (If Needed)

If you need to undo a migration:

### Rollback Exclusive Purchase Migration
```sql
-- Remove columns from purchases table
ALTER TABLE purchases DROP COLUMN IF EXISTS beat_audio_url;
ALTER TABLE purchases DROP COLUMN IF EXISTS beat_image_url;
ALTER TABLE purchases DROP COLUMN IF EXISTS notes;

-- Remove columns from beats table
ALTER TABLE beats DROP COLUMN IF EXISTS is_exclusive;
ALTER TABLE beats DROP COLUMN IF EXISTS is_hidden;
```

### Rollback Home Settings Migration
```sql
-- Drop the home_settings table
DROP TABLE IF EXISTS home_settings;
```

## Best Practices

1. **Always backup before migrating**
   - Keep backups for at least 7 days
   - Test restore procedures regularly

2. **Test on staging first**
   - Run migrations on a staging environment
   - Verify everything works before production

3. **Run during low traffic**
   - Schedule migrations during maintenance windows
   - Notify users of potential downtime

4. **Monitor after migration**
   - Check application logs
   - Monitor database performance
   - Watch for any errors

5. **Document changes**
   - Keep track of when migrations were run
   - Note any issues encountered
   - Document any manual fixes needed

## Verification Queries

After running migrations, verify with these queries:

### Check Purchases Table
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchases'
ORDER BY ordinal_position;
```

### Check Beats Table
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'beats'
ORDER BY ordinal_position;
```

### Check Home Settings Table
```sql
SELECT * FROM home_settings;
```

## Integration with Deployment

### Manual Deployment
1. Pull latest code
2. Run migrations
3. Restart application

### Automated Deployment
Add to your deployment script:
```bash
#!/bin/bash
echo "Running database migrations..."
node migrate-exclusive-purchases.js
node migrate-home-settings.js
echo "Migrations complete!"
```

### Docker Deployment
Add to your Dockerfile or docker-compose:
```dockerfile
RUN node migrate-exclusive-purchases.js && \
    node migrate-home-settings.js
```

## Support

If you encounter issues:
1. Check the error message carefully
2. Review the troubleshooting section
3. Check database logs
4. Verify database connection
5. Ensure you have the latest code

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2024-12-04 | migrate-exclusive-purchases.js | Added exclusive purchase support |
| 2024-12-04 | migrate-home-settings.js | Added home page customization |

## Future Migrations

When adding new features that require database changes:
1. Create a new migration script
2. Follow the naming convention: `migrate-feature-name.js`
3. Include verification steps
4. Update this guide
5. Test thoroughly before deploying
