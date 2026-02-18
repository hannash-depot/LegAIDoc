# LegAIDoc Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git (optional)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd "/Users/hanna/Google Drive/Claude/LegAIDoc"
npm install
```

### 2. Set Up PostgreSQL Database

Create a new database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE legaidoc;

# Exit psql
\q
```

### 3. Configure Environment Variables

Update the `.env` file with your database credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/legaidoc?schema=public"

# NextAuth - Generate a secure secret
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

Copy the output and paste it into your `.env` file.

### 4. Initialize Database

```bash
# Generate Prisma Client
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && npx prisma generate

# Push schema to database (creates tables)
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && npx prisma db push

# Seed the database with template data
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && npx prisma db seed
```

### 5. Run Development Server

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && npm run dev
```

The application will be available at: **http://localhost:3000**

---

## Testing the Application

### 1. Register a New User

1. Go to http://localhost:3000/he/register (Hebrew) or http://localhost:3000/en/register (English)
2. Fill in the registration form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: testpassword123
3. Click "Sign Up"
4. You should be automatically logged in and redirected to the dashboard

### 2. Browse Templates

1. Click "Templates" in the navigation
2. Click on a category to expand it
3. You should see available contract templates

### 3. Create a Document

1. Click on a template (e.g., "Apartment Rental Agreement")
2. You'll be redirected to the wizard
3. Fill in the form fields step by step
4. Click "Next" to proceed through steps
5. Your progress is automatically saved

### 4. View Your Documents

1. Click "Dashboard" in the navigation
2. You should see all your documents
3. Click on a document to view it
4. Draft documents show an "Edit" button
5. Completed documents show a "Download PDF" button

### 5. Test Logout

1. Click on your user avatar in the top-right
2. Click "Logout"
3. You should be redirected to the home page

---

## Common Issues

### Issue: "Module not found" errors

**Solution**: Make sure all dependencies are installed:
```bash
npm install
```

### Issue: "Database connection error"

**Solution**:
1. Make sure PostgreSQL is running: `brew services start postgresql` (Mac) or `sudo service postgresql start` (Linux)
2. Verify your DATABASE_URL in `.env` is correct
3. Make sure the database `legaidoc` exists

### Issue: "NEXTAUTH_SECRET not set"

**Solution**: Generate and add a secret to your `.env`:
```bash
openssl rand -base64 32
```

### Issue: "No templates showing up"

**Solution**: Make sure you ran the seed command:
```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && npx prisma db seed
```

### Issue: Prisma Client errors

**Solution**: Regenerate the Prisma Client:
```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && npx prisma generate
```

---

## Project Structure

```
LegAIDoc/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/           # Login/Register pages
│   │   │   ├── (dashboard)/      # Dashboard & Documents
│   │   │   ├── (main)/           # Public pages (Home, Templates)
│   │   │   ├── wizard/           # Wizard flow
│   │   │   └── layout.tsx
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── layout/               # Navbar, Footer
│   │   ├── providers/            # Session, Wizard providers
│   │   └── wizard/               # Wizard components
│   ├── lib/
│   │   ├── auth.ts              # NextAuth configuration
│   │   ├── db.ts                # Prisma client
│   │   ├── i18n/                # Internationalization
│   │   ├── pdf/                 # PDF generation
│   │   └── templates/           # Template engine
│   └── types/                   # TypeScript types
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
├── messages/                    # Translation files
│   ├── en.json
│   ├── he.json
│   ├── ar.json
│   └── ru.json
└── .env                         # Environment variables
```

---

## Next Steps

1. ✅ Set up the database
2. ✅ Test user registration and login
3. ✅ Browse templates and create a document
4. 🔲 Implement PDF generation endpoint
5. 🔲 Add more template definitions
6. 🔲 Customize branding and styling
7. 🔲 Deploy to production (Vercel, Railway, etc.)

---

## Support

For questions or issues, refer to:
- **IMPLEMENTATION_STATUS.md** - Detailed implementation status
- **README.md** - Project overview
- Next.js documentation: https://nextjs.org/docs
- NextAuth documentation: https://authjs.dev
- Prisma documentation: https://www.prisma.io/docs

---

**Happy Coding! 🚀**
