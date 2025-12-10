# Render Deployment Guide

## Overview
This guide will help you deploy BeatBazaar to Render with a PostgreSQL database.

## Prerequisites
- Render account (free tier available)
- Your code pushed to GitHub
- All migrations ready to run

## Step 1: Create PostgreSQL Database on Render

### 1.1 Create Database Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `beatbazaar-db` (or your preferred name)
   - **Database**: `beatbazaar`
   - **User**: `beatbazaar_user`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15 (recommended)
   - **Plan**: Free (for testing) or Starter+ (for production)

### 1.2 Get Database Connection Details
After creation, Render will provide:
- **Internal Database URL**: `postgresql://user:pass@hostname:5432/dbname`
- **External Database URL**: `postgresql://user:pass@external-hostname:5432/dbname`

**Important**: Use the **Internal Database URL** for your web service (faster and free internal networking).

## Step 2: Create Web Service on Render

### 2.1 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `beatbazaar-app`
   - **Region**: Same as your database
   - **Branch**: `main` (or your deployment branch)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2.2 Configure Environment Variables
In the **Environment** section, add these variables:

#### Required Variables:
```bash
# Database (use Internal Database URL from Step 1.2)
DATABASE_URL=postgresql://beatbazaar_user:password@dpg-xxxxx-a:5432/beatbazaar

# Session Security
SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random

# Node Environment
NODE_ENV=production

# Optional: Email Settings (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### How to Get DATABASE_URL:
1. Go to your PostgreSQL service in Render
2. Click on **"Connect"**
3. Copy the **"Internal Database URL"**
4. Paste it as `DATABASE_URL` in your web service environment variables

## Step 3: Update Your Code for Production

### 3.1 Update package.json
Make sure your `package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.server.json"
  }
}
```

### 3.2 Create tsconfig.server.json (if not exists)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./server",
    "module": "ESNext",
    "target": "ES2022"
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules", "dist", "client"]
}
```

### 3.3 Update server/index.js (or create if needed)
```javascript
import { createServer } from './server.js';

const port = process.env.PORT || 3000;

createServer().then(server => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
});
```

## Step 4: Run Database Migrations

### Option A: Run Migrations Locally (Recommended)
1. **Temporarily** set your local `DATABASE_URL` to the Render database:
   ```bash
   # In your local .env file, temporarily change to:
   DATABASE_URL=postgresql://beatbazaar_user:password@external-hostname:5432/beatbazaar
   ```

2. Run migrations locally:
   ```bash
   node migrate-exclusive-purchases.js
   node migrate-home-settings.js
   ```

3. **Restore** your local `.env` to localhost settings

### Option B: Run Migrations on Render (Advanced)
1. Add migration commands to your build script in `package.json`:
   ```json
   {
     "scripts": {
       "build": "npm run migrate && npm run build:client && npm run build:server",
       "migrate": "node migrate-exclusive-purchases.js && node migrate-home-settings.js"
     }
   }
   ```

2. Deploy and let Render run migrations during build

## Step 5: Deploy

### 5.1 Push Your Code
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 5.2 Deploy on Render
1. Go to your web service in Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Watch the build logs for any errors

### 5.3 Verify Deployment
1. Check build logs for success
2. Visit your app URL (provided by Render)
3. Test database connection by trying to login

## Step 6: Post-Deployment Setup

### 6.1 Create Admin User
If migrations didn't create an admin user, you can:

1. **Option A**: Use the setup page
   - Visit `https://your-app.onrender.com/setup`
   - Follow the setup wizard

2. **Option B**: Connect to database directly
   ```bash
   # Connect to your Render PostgreSQL
   psql "postgresql://beatbazaar_user:password@external-hostname:5432/beatbazaar"
   
   # Create admin user
   INSERT INTO users (id, username, password, role, email) 
   VALUES (
     gen_random_uuid(),
     'admin',
     '$2a$10$encrypted_password_hash',
     'admin',
     'admin@yourdomain.com'
   );
   ```

### 6.2 Upload Sample Data (Optional)
1. Login as admin
2. Go to Admin Dashboard → Upload Beat
3. Upload some sample beats to test the system

## Troubleshooting

### Database Connection Issues

#### Error: `ECONNREFUSED`
**Cause**: Wrong database URL or database not running
**Solution**: 
1. Verify `DATABASE_URL` is correct
2. Use **Internal Database URL** (not external)
3. Ensure database service is running

#### Error: `password authentication failed`
**Cause**: Wrong credentials
**Solution**:
1. Check username/password in DATABASE_URL
2. Regenerate database password if needed

#### Error: `database does not exist`
**Cause**: Database name is wrong
**Solution**:
1. Check database name in URL
2. Create database if it doesn't exist

### Build Issues

#### Error: `Module not found`
**Cause**: Missing dependencies or wrong paths
**Solution**:
1. Check `package.json` dependencies
2. Verify import paths are correct
3. Run `npm install` locally to test

#### Error: `Command failed`
**Cause**: Build or start command is wrong
**Solution**:
1. Test build command locally: `npm run build`
2. Test start command locally: `npm start`
3. Update commands in Render settings

### Runtime Issues

#### Error: `Cannot connect to database`
**Cause**: Database URL or network issues
**Solution**:
1. Check Render service logs
2. Verify database service is in same region
3. Use internal database URL

#### Error: `Port already in use`
**Cause**: Wrong port configuration
**Solution**:
1. Use `process.env.PORT` in your server
2. Don't hardcode port numbers
3. Bind to `0.0.0.0` not `localhost`

## Environment Variables Reference

### Required for Render:
```bash
DATABASE_URL=postgresql://user:pass@internal-host:5432/dbname
SESSION_SECRET=long-random-secret-key
NODE_ENV=production
```

### Optional:
```bash
# Email (for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Limits
MAX_FILE_SIZE=50000000

# Custom Domain (if using)
DOMAIN=yourdomain.com
```

## Security Checklist

### Before Going Live:
- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set up proper CORS origins
- [ ] Configure file upload limits
- [ ] Set up database backups
- [ ] Monitor error logs

### Database Security:
- [ ] Use strong database password
- [ ] Restrict database access to your app only
- [ ] Regular database backups
- [ ] Monitor database performance

## Monitoring and Maintenance

### Render Dashboard:
- Monitor service health
- Check build/deploy logs
- Monitor resource usage
- Set up alerts

### Database Monitoring:
- Check connection count
- Monitor query performance
- Set up automated backups
- Monitor storage usage

### Application Monitoring:
- Check error logs regularly
- Monitor response times
- Track user activity
- Monitor file storage usage

## Scaling Considerations

### Free Tier Limitations:
- Service sleeps after 15 minutes of inactivity
- 750 hours/month limit
- Shared resources

### Upgrading to Paid:
- Always-on service
- More CPU/RAM
- Better performance
- Priority support

### Database Scaling:
- Monitor connection limits
- Consider connection pooling
- Upgrade database plan as needed
- Set up read replicas for high traffic

## Support Resources

### Render Documentation:
- [Render Docs](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Node.js Deployment](https://render.com/docs/deploy-node-express-app)

### BeatBazaar Documentation:
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)
- [Database Safety](./DEPLOYMENT_SAFETY.md)

### Getting Help:
1. Check Render service logs
2. Review database connection logs
3. Test locally with production DATABASE_URL
4. Contact Render support if needed

## Quick Start Checklist

For a quick deployment:

1. **Create PostgreSQL database on Render**
2. **Create web service connected to your GitHub repo**
3. **Set DATABASE_URL environment variable**
4. **Run migrations** (locally with production DB URL)
5. **Deploy and test**
6. **Create admin user**
7. **Upload sample content**

Your BeatBazaar should now be live on Render! 🎉