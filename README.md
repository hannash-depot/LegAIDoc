# LegAIDoc

AI-powered bilingual (Hebrew-Arabic) legal document generation platform for the Israeli market.

Users register, browse contract templates organized by category, fill a guided wizard, and download bilingual PDFs. The platform supports electronic signatures (ESIG), AI-powered document analysis, and Stripe payments.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI
- **Backend**: Next.js API routes, Prisma ORM (PostgreSQL)
- **Auth**: Auth.js v5 (credentials + Google OAuth), JWT sessions, MFA (TOTP)
- **AI**: Anthropic, OpenAI, Google Generative AI
- **Payments**: Stripe
- **Email**: Resend
- **Storage**: Vercel Blob
- **Rate Limiting**: Upstash Redis (production), in-memory fallback (dev)
- **Monitoring**: Sentry
- **i18n**: next-intl — Hebrew, Arabic, English, Russian (RTL-aware)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL 16

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file and fill in values
cp .env.example .env

# Start PostgreSQL (via Docker)
docker compose up -d

# Generate Prisma client and apply migrations
pnpm db:generate
pnpm db:migrate

# Seed development data (categories, templates, test users)
pnpm db:seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Default dev credentials:

| Email                | Password   | Role  |
| -------------------- | ---------- | ----- |
| `admin@legaidoc.com` | `admin123` | Admin |
| `user@legaidoc.com`  | `user123`  | User  |

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Start development server            |
| `pnpm build`         | Production build                    |
| `pnpm start`         | Start production server             |
| `pnpm lint`          | Run ESLint                          |
| `pnpm type-check`    | TypeScript compiler check           |
| `pnpm format`        | Format with Prettier                |
| `pnpm test`          | Run unit/integration tests (Vitest) |
| `pnpm test:coverage` | Run tests with coverage report      |
| `pnpm test:e2e`      | Run E2E tests (Playwright)          |
| `pnpm db:generate`   | Generate Prisma client              |
| `pnpm db:migrate`    | Create and apply migrations         |
| `pnpm db:push`       | Push schema to DB (destructive)     |
| `pnpm db:seed`       | Seed development data               |
| `pnpm db:studio`     | Open Prisma Studio                  |

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable                   | Required            | Description                                     |
| -------------------------- | ------------------- | ----------------------------------------------- |
| `DATABASE_URL`             | Yes                 | PostgreSQL connection string                    |
| `AUTH_SECRET`              | Yes                 | Session signing key (`openssl rand -base64 32`) |
| `FIELD_ENCRYPTION_KEY`     | Production          | AES-256 key (`openssl rand -hex 32`)            |
| `UPSTASH_REDIS_REST_URL`   | Production          | Distributed rate limiting                       |
| `UPSTASH_REDIS_REST_TOKEN` | Production          | Distributed rate limiting                       |
| `ESIG_RSA_PRIVATE_KEY`     | If ESIG enabled     | RSA-2048 private key (PEM)                      |
| `ESIG_RSA_PUBLIC_KEY`      | If ESIG enabled     | RSA-2048 public key (PEM)                       |
| `STRIPE_SECRET_KEY`        | If payments enabled | Stripe API key                                  |
| `RESEND_API_KEY`           | If emails enabled   | Resend email API key                            |
| `SENTRY_DSN`               | Recommended         | Error tracking                                  |

### Feature Flags

| Flag                            | Default | Description                 |
| ------------------------------- | ------- | --------------------------- |
| `NEXT_PUBLIC_FEATURE_ESIG`      | `false` | Electronic signatures       |
| `NEXT_PUBLIC_FEATURE_PAYMENTS`  | `false` | Stripe payment processing   |
| `NEXT_PUBLIC_FEATURE_AI_IMPORT` | `false` | AI template import/analysis |
| `NEXT_PUBLIC_FEATURE_EMAILS`    | `false` | Transactional emails        |

## Production Deployment (Vercel)

1. Connect your Git repo to Vercel
2. Set all environment variables in the Vercel dashboard
3. Provision PostgreSQL (Neon, Supabase, or Vercel Postgres) with connection pooling
4. Provision Upstash Redis for rate limiting
5. Run `pnpm db:migrate` against production DB
6. Seed initial categories and templates via the admin UI
7. Configure custom domain and email DNS records (SPF, DKIM, DMARC)

The app uses `@sparticuz/chromium` for serverless PDF generation and `@vercel/blob` for file storage — both are Vercel-compatible out of the box.

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-prefixed pages
│   │   ├── (auth)/        # Auth pages (login, register)
│   │   └── (main)/        # Main app (dashboard, wizard, admin)
│   └── api/               # API routes
├── components/            # React components
├── lib/
│   ├── ai/                # AI providers, PII masking
│   ├── api/               # Response helpers, auth guards, rate limiting
│   ├── crypto/            # Field-level encryption (AES-256-GCM)
│   ├── email/             # Transactional email templates
│   ├── payments/          # Stripe integration, usage limits
│   ├── pdf/               # PDF generation (Puppeteer)
│   ├── signatures/        # Electronic signature service (RSA, OTP)
│   ├── storage/           # Vercel Blob wrapper
│   └── templates/         # Template compiler and renderer
├── schemas/               # Zod validation schemas
└── middleware.ts           # CSP, auth redirects, locale detection
messages/                  # i18n JSON files (he, ar, en, ru)
prisma/                    # Schema and migrations
tests/
├── unit/                  # Vitest unit tests
├── integration/           # API integration tests
└── e2e/                   # Playwright E2E tests
```

## License

Proprietary. All rights reserved.
