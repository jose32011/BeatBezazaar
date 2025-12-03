#!/bin/bash
# PostgreSQL Setup Script for Raspberry Pi 5

echo "=== Installing PostgreSQL on Raspberry Pi 5 ==="

# Update package list
sudo apt update

# Install PostgreSQL and contrib package
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql

echo ""
echo "=== Creating Database and User ==="

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE "MusicDB";

-- Create user
CREATE USER pi WITH PASSWORD '468832';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "MusicDB" TO pi;

-- Connect to MusicDB and grant schema privileges
\c MusicDB
GRANT ALL ON SCHEMA public TO pi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pi;

-- List databases
\l

-- Quit
\q
EOF

echo ""
echo "=== PostgreSQL Setup Complete ==="
echo "Database: MusicDB"
echo "User: pi"
echo "Password: 468832"
echo "Connection string: postgresql://pi:468832@localhost:5432/MusicDB"
echo ""
echo "To connect manually: psql -U pi -d MusicDB"
