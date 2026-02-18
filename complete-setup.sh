#!/bin/bash

# Complete LegAIDoc Setup
# Run this after PostgreSQL is running

set -e

echo "🚀 Completing LegAIDoc Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Add Postgres.app to PATH
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo ""
    echo "Please start PostgreSQL:"
    echo "  1. Open Postgres.app from Applications"
    echo "  2. Click the 'Start' or ▶ button"
    echo "  3. Wait a few seconds"
    echo "  4. Run this script again"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} PostgreSQL is running"

# Check if database exists
DB_EXISTS=$(psql -lqt | cut -d \| -f 1 | grep -w legaidoc | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo ""
    echo "Creating database 'legaidoc'..."
    psql postgres -c "CREATE DATABASE legaidoc;"
    echo -e "${GREEN}✓${NC} Database created"
else
    echo -e "${GREEN}✓${NC} Database 'legaidoc' already exists"
fi

# Update .env file with correct database URL
echo ""
echo "Updating .env file..."
DB_USER=$(whoami)
DATABASE_URL="postgresql://$DB_USER@localhost:5432/legaidoc?schema=public"

if [ -f .env ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    else
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    fi
    echo -e "${GREEN}✓${NC} .env updated with DATABASE_URL"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Setup NVM and run Prisma commands
echo ""
echo "Setting up Node environment..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
fi

# Generate Prisma Client
echo ""
echo "Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓${NC} Prisma client generated"

# Push schema to database
echo ""
echo "Creating database tables..."
npx prisma db push --accept-data-loss
echo -e "${GREEN}✓${NC} Database schema created"

# Seed database
echo ""
echo "Seeding database with template data..."
npx prisma db seed
echo -e "${GREEN}✓${NC} Database seeded"

# Optional: Install puppeteer
echo ""
read -p "Do you want to install Puppeteer for PDF generation? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing Puppeteer..."
    npm install puppeteer
    echo -e "${GREEN}✓${NC} Puppeteer installed"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🎉 Your LegAIDoc application is ready!"
echo ""
echo "Next steps:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Register a new account"
echo "  4. Start creating documents!"
echo ""
echo "Database Info:"
echo "  Database: legaidoc"
echo "  User: $DB_USER"
echo "  URL: $DATABASE_URL"
echo ""
