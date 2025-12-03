# MySQL to PostgreSQL Migration Guide

## ✅ Completed Changes

### 1. Environment Variables (.env)
- ✅ Changed `DATABASE_URL` from `mysql://` to `postgresql://`
- ✅ Replaced `MYSQL_*` variables with `POSTGRES_*` variables

### 2. Schema (shared/schema.ts)
- ✅ Changed all imports from `drizzle-orm/mysql-core` to `drizzle-orm/pg-core`
- ✅ Replaced all `mysqlTable` with `pgTable` (15+ tables)
- ✅ Replaced `int` with `integer`
- ✅ Replaced `double` with `doublePrecision`
- ✅ Replaced `tinyint` with `boolean`
- ✅ Changed `default(sql\`CURRENT_TIMESTAMP\`)` to `defaultNow()`
- ✅ Removed `.onUpdateNow()` calls

### 3. Drizzle Config (drizzle.config.ts)
- ✅ Changed dialect to always use `"postgresql"`
- ✅ Removed SQLite and MySQL fallbacks

### 4. Server Code
- ✅ Updated `server/storage.ts` to use PostgreSQL exclusively
- ✅ Updated `server/setup.ts` to use PostgreSQL
- ✅ Removed MySQL imports and dependencies
- ✅ Removed `mysql2` from package.json

## 🚀 Setup Instructions for Raspberry Pi 5

### Step 1: Install and Configure PostgreSQL

Run the automated setup script:
```bash
chmod +x setup-postgres-pi5.sh
./setup-postgres-pi5.sh
```

Or manually:
```bash
# Update and install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE "MusicDB";
CREATE USER pi WITH PASSWORD '468832';
GRANT ALL PRIVILEGES ON DATABASE "MusicDB" TO pi;
\c MusicDB
GRANT ALL ON SCHEMA public TO pi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pi;
\q
EOF
```

### Step 2: Verify Environment Variables

Your `.env` file should have:
```env
DATABASE_URL=postgresql://pi:468832@localhost:5432/MusicDB
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=pi
POSTGRES_PASSWORD=468832
POSTGRES_DB=MusicDB
```

### Step 3: Install Dependencies

```bash
# Remove old MySQL dependencies and install fresh
npm install
```

### Step 4: Initialize Database Schema

```bash
# Push schema to PostgreSQL
npm run db:push
```

### Step 5: Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 🔧 Manual Database Connection Test

Test your PostgreSQL connection:
```bash
# Connect to database
psql -U pi -d MusicDB -h localhost

# List tables
\dt

# Check users table
SELECT * FROM users;

# Exit
\q
```

## 📊 Data Migration (if needed)

If you have existing MySQL data to migrate:

### 1. Export from MySQL
```bash
mysqldump -u pi -p MusicDB > mysql_backup.sql
```

### 2. Convert MySQL dump to PostgreSQL format
You'll need to modify the SQL:
- Change `AUTO_INCREMENT` to `SERIAL`
- Change `TINYINT(1)` to `BOOLEAN`
- Change `DOUBLE` to `DOUBLE PRECISION`
- Change backticks to double quotes for identifiers
- Remove `ENGINE=InnoDB`

### 3. Import to PostgreSQL
```bash
psql -U pi -d MusicDB -h localhost < postgres_converted.sql
```

## 🧪 Testing Checklist

After migration, verify:
- [ ] PostgreSQL service is running
- [ ] Database connection works
- [ ] Application starts without errors
- [ ] User authentication works
- [ ] Beat upload/download works
- [ ] Cart functionality works
- [ ] Payment processing works
- [ ] All API endpoints respond correctly

## 🐛 Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Permission Denied
```bash
# Grant all permissions to user
sudo -u postgres psql -d MusicDB -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pi;"
sudo -u postgres psql -d MusicDB -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pi;"
```

### Port Already in Use
```bash
# Check what's using port 5432
sudo lsof -i :5432

# Change PostgreSQL port in /etc/postgresql/*/main/postgresql.conf
# Then update your .env file
```

## 📝 Important Notes

- PostgreSQL is case-sensitive for table/column names in queries
- Boolean values are `true`/`false` not `1`/`0`
- Timestamps are handled differently - use `CURRENT_TIMESTAMP` or `NOW()`
- PostgreSQL has better JSON support than MySQL
- Connection pooling works differently - we're using `postgres` library

## 🎯 Next Steps

1. Run the setup script: `./setup-postgres-pi5.sh`
2. Verify `.env` configuration
3. Run `npm install` to update dependencies
4. Run `npm run db:push` to create tables
5. Start your application with `npm run dev`
6. Test all functionality

Your application is now fully migrated to PostgreSQL! 🎉
