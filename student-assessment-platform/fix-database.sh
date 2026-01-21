#!/bin/bash

# Quick Database Fix Script
# This script helps set up the database connection

cd "/Users/vamsimundra/Desktop/Assessment Project/student-assessment-platform"

echo "🔧 Database Connection Fix"
echo "========================="
echo ""

# Check PostgreSQL
echo "1. Checking PostgreSQL..."
if psql -h localhost -p 5432 -U $(whoami) -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ PostgreSQL is running on port 5432"
else
  echo "❌ Cannot connect to PostgreSQL on port 5432"
  echo "   Please start PostgreSQL first"
  exit 1
fi

# Get username
DB_USER=$(whoami)
echo "   Using database user: $DB_USER"
echo ""

# Create database if it doesn't exist
DB_NAME="student_assessment"
echo "2. Creating database '$DB_NAME' if it doesn't exist..."
psql -h localhost -p 5432 -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "   Database already exists or created"
echo ""

# Update .env file
echo "3. Updating .env file..."
ENV_FILE=".env"

# Create .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  touch "$ENV_FILE"
fi

# Update or add DATABASE_URL
if grep -q "DATABASE_URL" "$ENV_FILE"; then
  # Update existing DATABASE_URL
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://$DB_USER@localhost:5432/$DB_NAME\"|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://$DB_USER@localhost:5432/$DB_NAME\"|" "$ENV_FILE"
  fi
  echo "✅ Updated DATABASE_URL in .env"
else
  # Add DATABASE_URL
  echo "" >> "$ENV_FILE"
  echo "DATABASE_URL=\"postgresql://$DB_USER@localhost:5432/$DB_NAME\"" >> "$ENV_FILE"
  echo "✅ Added DATABASE_URL to .env"
fi

echo ""
echo "4. Running migrations..."
npx prisma migrate dev --name init 2>&1 | tail -10

echo ""
echo "5. Seeding database..."
npm run db:seed-simple 2>&1 | tail -10

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart your dev server (if running)"
echo "   2. Try login again at http://localhost:3000/login"
echo "   3. Use email: student@test-school.com"

