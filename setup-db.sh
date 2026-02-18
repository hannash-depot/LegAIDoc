#!/bin/bash

# LegAIDoc Database Setup Script
# This script helps you set up the PostgreSQL database for LegAIDoc

set -e  # Exit on error

echo "🚀 LegAIDoc Database Setup"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  macOS:   brew install postgresql@14"
    echo "  Ubuntu:  sudo apt-get install postgresql postgresql-contrib"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} PostgreSQL is installed"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${YELLOW}⚠${NC}  PostgreSQL is not running. Starting it..."

    # Try to start PostgreSQL (macOS with Homebrew)
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 || brew services start postgresql
    else
        echo -e "${RED}Please start PostgreSQL manually:${NC}"
        echo "  macOS:   brew services start postgresql"
        echo "  Ubuntu:  sudo service postgresql start"
        exit 1
    fi

    # Wait a bit for PostgreSQL to start
    sleep 2
fi

echo -e "${GREEN}✓${NC} PostgreSQL is running"

# Get database credentials
echo ""
echo "Enter PostgreSQL credentials (or press Enter for defaults):"
read -p "Username [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Password: " DB_PASS
echo ""

read -p "Database name [legaidoc]: " DB_NAME
DB_NAME=${DB_NAME:-legaidoc}

read -p "Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Test connection
echo ""
echo "Testing PostgreSQL connection..."
if PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw postgres; then
    echo -e "${GREEN}✓${NC} Connection successful"
else
    echo -e "${RED}❌ Connection failed${NC}"
    echo "Please check your credentials and try again"
    exit 1
fi

# Check if database exists
DB_EXISTS=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo ""
    echo "Creating database '$DB_NAME'..."
    PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✓${NC} Database created"
else
    echo -e "${YELLOW}⚠${NC}  Database '$DB_NAME' already exists"
fi

# Update .env file
echo ""
echo "Updating .env file..."

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup

    # Update DATABASE_URL
    if grep -q "^DATABASE_URL=" .env; then
        # macOS and Linux compatible sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        else
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        fi
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
    fi

    echo -e "${GREEN}✓${NC} .env file updated (backup saved as .env.backup)"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Setup Node environment
echo ""
echo "Setting up Node environment..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
fi

# Run Prisma commands
echo ""
echo "Running Prisma migrations..."
npx prisma generate
echo -e "${GREEN}✓${NC} Prisma client generated"

echo ""
echo "Pushing database schema..."
npx prisma db push --accept-data-loss
echo -e "${GREEN}✓${NC} Database schema created"

echo ""
echo "Seeding database with template data..."
npx prisma db seed
echo -e "${GREEN}✓${NC} Database seeded"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Database setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Visit: http://localhost:3000"
echo "  3. Register a new account and start creating documents!"
echo ""
