# 📄 LegAIDoc - Legal Documents Made Easy

A modern web application for creating professional legal contracts with AI-powered assistance. Built with Next.js 15, Prisma, and NextAuth.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## ✨ Features

- 🔐 **Secure Authentication** - Email/password and OAuth (Google, Facebook)
- 🛡️ **Abuse Protection** - Built-in rate limiting on sensitive auth/document APIs
- 🌍 **Multi-language Support** - Hebrew, Arabic, English, Russian
- 📝 **Template-based Contracts** - Pre-built legal document templates
- 🎨 **Wizard Interface** - Step-by-step guided document creation
- 📊 **Document Management** - Dashboard to view and manage all documents
- 📑 **PDF Generation** - Export documents as professional PDFs
- 🎯 **Real-time Preview** - See your document as you fill it
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚖️ **Legal Pages** - Public Terms of Service and Privacy Policy pages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git (optional)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "/Users/hanna/Google Drive/Claude/LegAIDoc"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Puppeteer for PDF generation** (optional, but recommended)
   ```bash
   npm install puppeteer
   ```

4. **Set up the database**

   **Option A: Automated Setup (Recommended)**
   ```bash
   ./setup-db.sh
   ```

   **Option B: Manual Setup**
   ```bash
   # Install PostgreSQL (if not installed)
   brew install postgresql@14  # macOS
   # or
   sudo apt-get install postgresql  # Linux

   # Start PostgreSQL
   brew services start postgresql  # macOS
   # or
   sudo service postgresql start  # Linux

   # Create database
   psql -U postgres
   CREATE DATABASE legaidoc;
   \q

   # Update .env with your credentials
   # Then run:
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
LegAIDoc/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── (auth)/        # Login & Registration
│   │   │   ├── (dashboard)/   # User Dashboard
│   │   │   ├── (main)/        # Public Pages
│   │   │   └── wizard/        # Document Creation Wizard
│   │   └── api/               # API Routes
│   ├── components/
│   │   ├── layout/            # Navbar, Footer
│   │   ├── providers/         # Context Providers
│   │   └── wizard/            # Wizard Components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth Configuration
│   │   ├── db.ts              # Prisma Client
│   │   ├── i18n/              # Internationalization
│   │   ├── pdf/               # PDF Generation
│   │   └── templates/         # Template Engine
│   └── types/                 # TypeScript Definitions
├── prisma/
│   ├── schema.prisma          # Database Schema
│   └── seed.ts                # Seed Data
├── messages/                  # Translation Files
│   ├── en.json                # English
│   ├── he.json                # Hebrew
│   ├── ar.json                # Arabic
│   └── ru.json                # Russian
├── .env                       # Environment Variables
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create or update `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/legaidoc?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secure-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_TERMS_VERSION="2026-02-25"
NEXT_PUBLIC_PRIVACY_VERSION="2026-02-25"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""

# Monitoring (Optional)
ALERT_WEBHOOK_URL=""
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Database Schema

The application uses Prisma ORM with PostgreSQL. Key models:

- **User** - User accounts and authentication
- **Document** - User-created documents
- **ContractTemplate** - Template definitions
- **TemplateCategory** - Template organization

## 📚 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with templates
npm run db:studio    # Open Prisma Studio
```

## 🌐 Internationalization

The application supports 4 languages:

- **Hebrew (he)** - Default, RTL layout
- **Arabic (ar)** - RTL layout
- **English (en)** - LTR layout
- **Russian (ru)** - LTR layout

Translation files are located in `messages/` directory.

## 🔐 Authentication

The application uses **NextAuth v5** with:

- Credentials provider (email/password)
- Google OAuth (optional)
- Facebook OAuth (optional)
- JWT sessions
- Protected routes via middleware

## 📝 Creating Documents

1. **Browse Templates** - Select from available contract templates
2. **Fill the Wizard** - Complete the step-by-step form
3. **Preview** - Review your document in real-time
4. **Save** - Documents are auto-saved as you progress
5. **Export** - Download as PDF when complete

## 🎨 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth v5
- **Database**: PostgreSQL + Prisma ORM
- **i18n**: next-intl
- **PDF**: Puppeteer
- **Forms**: Zod validation

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure

**Note**: For PDF generation in production, ensure your hosting platform supports Puppeteer or use a PDF generation service.

## 🐛 Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Verify database exists: `psql -l`

### Missing Dependencies

```bash
npm install
npm run db:generate
```

### PDF Generation Fails

```bash
npm install puppeteer
```

For serverless environments, use `@sparticuz/chromium-min`:
```bash
npm install @sparticuz/chromium-min puppeteer-core
```

## 📖 Documentation

- **QUICK_START.md** - Step-by-step setup guide
- **IMPLEMENTATION_STATUS.md** - Development progress
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://authjs.dev)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Authentication by [NextAuth](https://authjs.dev)
- Database ORM by [Prisma](https://www.prisma.io)

---

**Made with ❤️ for easier legal document creation**
