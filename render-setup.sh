#!/bin/bash

# BeatBazaar Render Setup Script
# This script helps you set up your database on Render

echo "🚀 BeatBazaar Render Setup"
echo "=========================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not found"
    echo ""
    echo "📋 To fix this:"
    echo "1. Create a PostgreSQL database on Render"
    echo "2. Copy the Internal Database URL"
    echo "3. Set it as DATABASE_URL in your .env file or Render environment"
    echo ""
    echo "Example:"
    echo "DATABASE_URL=postgresql://user:pass@dpg-xxxxx-a:5432/dbname"
    echo ""
    exit 1
fi

echo "🔍 Found DATABASE_URL, initializing database..."
echo ""

# Run the database initialization
node init-render-database.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Your BeatBazaar is ready:"
    echo "• Database tables created"
    echo "• Default data inserted"
    echo "• Admin user created (admin/admin123)"
    echo ""
    echo "🔗 Next steps:"
    echo "1. Visit your Render app URL"
    echo "2. Login with admin/admin123"
    echo "3. Change the admin password"
    echo "4. Start uploading beats!"
else
    echo ""
    echo "❌ Setup failed. Check the error messages above."
    echo ""
    echo "🔧 Common issues:"
    echo "• Wrong DATABASE_URL"
    echo "• Database service not running"
    echo "• Network connectivity problems"
    echo ""
    exit 1
fi