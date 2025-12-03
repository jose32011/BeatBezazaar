# Quick Start: PostgreSQL Setup on Raspberry Pi 5

## 🚀 One-Command Setup

Run this single command to set up everything:

```bash
./setup-postgres-pi5.sh && npm install && npm run db:push
```

## 📋 Step-by-Step Instructions

### 1. Install PostgreSQL (5 minutes)

```bash
# Make script executable
chmod +x setup-postgres-pi5.sh

# Run the setup script
./setup-postgres-pi5.sh
```

This script will:
- Install PostgreSQL
- Create the `MusicDB` database
- Create user `pi` with password `468832`
- Grant all necessary permissions

### 2. Verify Installation

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U pi -d MusicDB -h localhost -c "SELECT version();"
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Initialize Database Schema

```bash
# Push schema to PostgreSQL
npm run db:push
```

### 5. Start the Application

```bash
# Development mode
npm run dev
```

Visit `http://localhost:3000` and you should see your application running!

## ✅ Verification Checklist

- [ ] PostgreSQL service is running: `sudo systemctl status postgresql`
- [ ] Can connect to database: `psql -U pi -d MusicDB`
- [ ] `.env` file has correct PostgreSQL credentials
- [ ] Dependencies installed: `npm install` completed
- [ ] Schema pushed: `npm run db:push` completed
- [ ] Application starts: `npm run dev` works

## 🔧 Troubleshooting

### PostgreSQL won't start
```bash
sudo systemctl restart postgresql
sudo journalctl -u postgresql -n 50
```

### Can't connect to database
```bash
# Check if PostgreSQL is listening
sudo netstat -plnt | grep 5432

# Check PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

# Check pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Ensure line exists: local all pi md5
```

### Permission denied
```bash
sudo -u postgres psql -d MusicDB << EOF
GRANT ALL PRIVILEGES ON DATABASE "MusicDB" TO pi;
GRANT ALL ON SCHEMA public TO pi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pi;
EOF
```

## 📝 Environment Variables

Your `.env` should contain:

```env
DATABASE_URL=postgresql://pi:468832@localhost:5432/MusicDB
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=pi
POSTGRES_PASSWORD=468832
POSTGRES_DB=MusicDB
```

## 🎯 Next Steps

1. Create an admin account through the setup UI
2. Upload some beats
3. Configure Stripe for payments (optional)
4. Set up email notifications (optional)

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- Full migration guide: See `POSTGRES_MIGRATION.md`

## 🆘 Need Help?

If you encounter issues:
1. Check the logs: `sudo journalctl -u postgresql -f`
2. Verify your `.env` file
3. Ensure PostgreSQL is running
4. Check database permissions

Happy coding! 🎉
