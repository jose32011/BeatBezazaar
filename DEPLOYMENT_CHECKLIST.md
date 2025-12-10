# Deployment Checklist

## Pre-Deployment

### 1. Backup Database
- [ ] Create database backup
  ```bash
  pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
  ```
- [ ] Backup uploads folder
  ```bash
  tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
  ```
- [ ] Store backups in safe location

### 2. Code Review
- [ ] All changes committed to git
- [ ] Code reviewed and tested locally
- [ ] No console errors or warnings
- [ ] All tests passing (if applicable)

### 3. Environment Check
- [ ] `.env` file configured correctly
- [ ] `DATABASE_URL` is correct
- [ ] All required environment variables set
- [ ] Database server is running

## Deployment Steps

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Database Migrations
```bash
# Run all migrations
node migrate-exclusive-purchases.js
node migrate-home-settings.js
```

**Expected Output**: ✅ Migration completed successfully!

### 4. Build Application
```bash
npm run build
```

### 5. Restart Application
```bash
# If using PM2
pm2 restart beatbazaar

# If using systemd
sudo systemctl restart beatbazaar

# If running manually
# Stop the current process and start again
npm run start
```

## Post-Deployment Verification

### 1. Application Health
- [ ] Application starts without errors
- [ ] No errors in console/logs
- [ ] Server responds to requests

### 2. Database Verification
- [ ] Run verification queries:
  ```sql
  -- Check purchases table
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'purchases' 
  AND column_name IN ('beat_audio_url', 'beat_image_url', 'notes');
  
  -- Check beats table
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'beats' 
  AND column_name IN ('is_exclusive', 'is_hidden');
  
  -- Check home_settings table
  SELECT * FROM home_settings;
  ```

### 3. Feature Testing

#### Home Settings Feature
- [ ] Login as admin
- [ ] Navigate to Settings > Home Page
- [ ] Edit home page settings
- [ ] Click Save
- [ ] Verify changes appear on home page
- [ ] Check image preview works

#### Exclusive Purchase Feature
- [ ] Login as admin
- [ ] Navigate to Admin Dashboard > Exclusive Purchases
- [ ] Verify tab loads without errors
- [ ] Check "No pending purchases" message appears (if no purchases)

#### Database Safety Feature
- [ ] Navigate to Settings > Database
- [ ] Click "Clear All Data"
- [ ] Verify confirmation dialog shows data counts
- [ ] Click Cancel (don't actually reset!)
- [ ] Verify dialog closes

### 4. User Experience Testing
- [ ] Home page loads correctly
- [ ] Featured section displays properly
- [ ] Beats are visible (not hidden)
- [ ] Cart functionality works
- [ ] Purchase flow works
- [ ] Admin dashboard accessible

## Rollback Plan

If something goes wrong:

### 1. Stop Application
```bash
pm2 stop beatbazaar
# or
sudo systemctl stop beatbazaar
```

### 2. Restore Database
```bash
psql -U username -d database_name < backup_YYYYMMDD.sql
```

### 3. Restore Uploads
```bash
tar -xzf uploads_backup_YYYYMMDD.tar.gz
```

### 4. Revert Code
```bash
git revert HEAD
# or
git reset --hard <previous-commit-hash>
```

### 5. Restart Application
```bash
pm2 restart beatbazaar
# or
sudo systemctl restart beatbazaar
```

## Monitoring

### First Hour After Deployment
- [ ] Monitor error logs
- [ ] Check database connections
- [ ] Watch for any unusual activity
- [ ] Verify no performance degradation

### First Day After Deployment
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Monitor database performance
- [ ] Verify all features working

## Common Issues & Solutions

### Issue: Migration fails with "column already exists"
**Solution**: This is normal if migration was run before. Check verification step to confirm columns exist.

### Issue: Application won't start
**Solution**: 
1. Check error logs
2. Verify DATABASE_URL is correct
3. Ensure database is running
4. Check all dependencies installed

### Issue: Features not working
**Solution**:
1. Verify migrations ran successfully
2. Check browser console for errors
3. Clear browser cache
4. Restart application

### Issue: Database connection errors
**Solution**:
1. Verify database is running
2. Check DATABASE_URL format
3. Verify database user permissions
4. Check firewall settings

## Documentation Updates

After successful deployment:
- [ ] Update CHANGELOG.md
- [ ] Document any issues encountered
- [ ] Update deployment date in migration history
- [ ] Notify team of successful deployment

## New Features Deployed

### ✅ Home Settings Feature
- Customize home page featured section
- Edit title, description, features, and image
- Admin Settings > Home Page

### ✅ Exclusive Purchase Feature
- Admin approval for exclusive beat purchases
- Automatic beat hiding when purchased
- Beat deletion after approval
- Admin Dashboard > Exclusive Purchases

### ✅ Database Safety Feature
- Confirmation dialog before database reset
- Shows data counts before deletion
- Two-step confirmation process
- Settings > Database

## Support Contacts

If you need help:
- Check documentation in `/other/` folder
- Review error logs
- Check GitHub issues
- Contact development team

## Success Criteria

Deployment is successful when:
- ✅ Application starts without errors
- ✅ All migrations completed successfully
- ✅ Home page displays correctly
- ✅ Admin features accessible
- ✅ No errors in logs
- ✅ Users can browse and purchase beats
- ✅ All tests passing

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Notes**: _____________________________________________
