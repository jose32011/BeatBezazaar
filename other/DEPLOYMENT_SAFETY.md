# Deployment Safety Guide

## Database Reset Protection

The database reset functionality now includes safety checks to prevent accidental data loss during deployment or maintenance.

### How It Works

1. **Data Check Before Reset**: When you click "Clear All Data" in Admin Settings > Database, the system first checks if there's any data in the database.

2. **Confirmation Dialog**: If data exists, a detailed confirmation dialog shows:
   - Count of all records in each table (users, beats, genres, purchases, customers, cart items, payments, analytics)
   - A warning message if data exists
   - Clear indication that the action is permanent

3. **Two-Step Process**: 
   - First click: Checks database and shows counts
   - Second click (in dialog): Actually performs the reset

### Database Counts Displayed

The confirmation dialog shows counts for:
- **Users**: All user accounts
- **Beats**: All uploaded beats/tracks
- **Genres**: Music genres
- **Purchases**: Completed purchases
- **Customers**: Customer records
- **Cart Items**: Items in shopping carts
- **Payments**: Payment records
- **Analytics**: Analytics data

### API Endpoints

#### Check Database Contents
```
GET /api/admin/reset-database/check
```
Returns counts of all records in the database.

#### Reset Database
```
POST /api/admin/reset-database
Body: { "confirmed": true }
```
- Requires `confirmed: true` in the request body if data exists
- Returns error if data exists and confirmation is not provided
- Deletes all data and uploaded files
- Creates a new default admin user (username: admin, password: admin123)

### Before Deployment Checklist

1. **Backup Your Data**: Always backup your database before deployment
   ```bash
   # PostgreSQL backup example
   pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
   ```

2. **Check Database Contents**: Use the admin panel to see what data exists

3. **Export Important Data**: If you need to preserve certain data:
   - Export beats/tracks
   - Export user lists
   - Export purchase records

4. **Test on Staging**: Always test deployment on a staging environment first

5. **Document Changes**: Keep track of what data you're resetting

### Recovery

If you accidentally reset the database:

1. **Restore from Backup**:
   ```bash
   psql -U username -d database_name < backup_file.sql
   ```

2. **Re-upload Files**: Restore audio and image files to the `uploads/` directory

3. **Verify Data**: Check that all data is restored correctly

### Best Practices

- **Never reset production database without confirmation**
- **Always have a recent backup before any database operations**
- **Use staging environment for testing**
- **Document all database changes**
- **Keep backup files in a secure location**
- **Test restore procedures regularly**

### Default Admin Credentials After Reset

After a database reset, a new admin user is created:
- **Username**: admin
- **Password**: admin123
- **⚠️ Change this password immediately after reset!**

### Additional Safety Features

- Requires admin authentication
- Shows detailed data counts before reset
- Two-step confirmation process
- Clear warning messages
- Cannot be undone warning

## Deployment Process

### Safe Deployment Steps

1. **Pre-Deployment**:
   ```bash
   # Backup database
   pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
   
   # Backup uploads folder
   tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
   ```

2. **Deploy Code**:
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

3. **Check Database**:
   - Login to admin panel
   - Go to Settings > Database
   - Click "Clear All Data" to see current counts
   - Cancel if you don't want to reset

4. **Post-Deployment**:
   - Verify application is running
   - Test critical functionality
   - Check that data is intact

### Emergency Rollback

If something goes wrong:

1. **Stop the application**
2. **Restore database from backup**
3. **Restore uploads folder**
4. **Restart application**
5. **Verify functionality**

## Support

If you encounter issues:
1. Check the server logs
2. Verify database connection
3. Ensure backups are available
4. Contact support if needed
