# 🚀 Deploy BeatBazaar to Render

## Quick Setup Guide

Your BeatBazaar is ready to deploy to Render! Follow these steps:

### 1. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `beatbazaar-app` (or your preferred name)
   - **Region**: `Oregon` (same as your database)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2. Set Environment Variables

In the **Environment** section of your web service, add these variables:

#### Required Variables:
```bash
DATABASE_URL=postgresql://musicdb_0f2p_user:IbqZNm0xnGYANWzwpGTGwxK6Lr9fvu0L@dpg-d4mh16ili9vc73eqftpg-a.oregon-postgres.render.com/musicdb_0f2p?sslmode=require

SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random-at-least-32-characters

NODE_ENV=production

MAX_FILE_SIZE=20000000
```

#### Optional Variables (for email features):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Deploy

1. Click **"Create Web Service"**
2. Render will automatically deploy from your GitHub repository
3. Watch the build logs for any errors
4. Once deployed, you'll get a URL like: `https://your-app-name.onrender.com`

### 4. Test Your Deployment

1. Visit your Render app URL
2. Login with: `admin` / `admin123`
3. **Important**: Change the admin password immediately!
4. Test uploading a beat
5. Test the cart functionality

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify the build command: `npm install && npm run build`
- Check build logs for specific errors

### App Won't Start
- Verify the start command: `npm start`
- Check that `NODE_ENV=production` is set
- Ensure `DATABASE_URL` is correct

### Database Connection Issues
- Your database URL is already configured correctly
- Make sure the database service is running
- Check that both services are in the same region (Oregon)

### Cart Not Working
- Ensure user is logged in
- Check browser console for errors
- Verify database connection is working

## 📋 Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Can login with admin credentials
- [ ] Change admin password
- [ ] Upload test beat
- [ ] Test audio playback
- [ ] Test cart functionality
- [ ] Test user registration
- [ ] Set up custom domain (optional)

## 🔒 Security Notes

- **Change the default admin password immediately**
- **Use a strong SESSION_SECRET** (at least 32 random characters)
- **Enable HTTPS** (automatic on Render)
- **Set up regular database backups**

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Review the build/deploy logs
3. Test locally with production environment variables
4. Contact Render support if needed

Your BeatBazaar is ready to go live! 🎵