# LegAIDoc — Claude Code Conventions

## Project Overview

LegAIDoc is an AI-powered bilingual (Hebrew-Arabic) legal document generation platform for the Israeli market. Users register, browse contract templates, fill a guided wizard, and download bilingual PDFs.

**Stack**: Next.js 15 (App Router), TypeScript, Prisma (PostgreSQL), Auth.js v5, Zod, Tailwind CSS 4, next-intl

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript compiler check
pnpm test             # Vitest unit/integration tests
pnpm test:e2e         # Playwright E2E tests
pnpm format           # Prettier format all
pnpm db:push          # Push schema to dev DB (destructive)
pnpm db:migrate       # Create + apply migration
pnpm db:generate      # Generate Prisma client
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
```

## Architecture Rules

- **API envelope**: All responses use `{ success: boolean, data?: T, error?: { code: string, message: string } }`. Use helpers from `src/lib/api/response.ts`.
- **Validation**: All input uses Zod schemas from `src/schemas/`. Share schemas between client and server.
- **i18n**: All user-facing text uses next-intl from `messages/{locale}.json`. Never hardcode strings.
- **RTL**: Use CSS logical properties (`ps-`, `pe-`, `ms-`, `me-`) instead of directional (`pl-`, `pr-`, `ml-`, `mr-`).
- **Admin API**: Routes under `/api/admin/` use `requireAdmin()` guard.
- **Public API**: Routes under `/api/` may or may not require auth.
- **Pages**: Under `app/[locale]/`. Auth pages in `(auth)` group, main app in `(main)` group.
- **Database**: Access only through Prisma client (`src/lib/db.ts` singleton).
- **PDF**: Generated through `src/lib/pdf/generator.ts`. Do not call Playwright directly elsewhere.
- **Templates**: Definitions validated by Zod schemas in `src/schemas/template-definition.ts`.

## Naming Conventions

- **Files**: kebab-case (`wizard-container.tsx`, `template-engine.ts`)
- **Components**: PascalCase (`WizardContainer`, `LocaleSwitcher`)
- **Zod schemas**: PascalCase + Schema suffix (`RegisterSchema`, `CategoryCreateSchema`)
- **API handlers**: Named exports (`GET`, `POST`, `PUT`, `DELETE`)
- **DB models**: PascalCase singular (`User`, `Template`, `Document`)
- **Env vars**: SCREAMING_SNAKE_CASE (`AUTH_SECRET`, `DATABASE_URL`)

## i18n Rules

- All 4 locale files (`he.json`, `ar.json`, `en.json`, `ru.json`) must have identical key structures
- New UI text requires keys in ALL 4 files
- Client components: `useTranslations('Namespace')`
- Server components: `getTranslations('Namespace')` via `next-intl/server`
- Hebrew (`he`) and Arabic (`ar`) = RTL; English (`en`) and Russian (`ru`) = LTR

## Testing

- API routes: integration tests in `tests/integration/`
- Zod schemas + utilities: unit tests in `tests/unit/`
- User flows: E2E tests in `tests/e2e/`
- All new code should have corresponding tests

## Locales

Supported: `he` (Hebrew), `ar` (Arabic), `en` (English), `ru` (Russian). Default: `he`.
