# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MotoPatío is a marketplace for buying/selling motorcycles in Ecuador. User-facing copy is in Spanish and should stay in Spanish. Production runs at motopatio.com on a Linux VM managed with pm2 (service name `motopatio`), deployed via `deploy.sh` (`git pull && npm i && prisma db push && prisma generate && npm run build && pm2 restart`).

## Stack

- **Next.js 16 App Router** + **React 19** + **TypeScript** (strict, `@/*` alias points to repo root — see `tsconfig.json`).
- **Prisma 5** over **MySQL** (`DATABASE_URL` in `.env`, schema in `prisma/schema.prisma`).
- **NextAuth 4** with Prisma adapter, JWT session strategy, Google + Credentials providers.
- **Cloudinary** for images, **Resend** for transactional email, **PayPhone "Cajita de Pagos"** for payments (the `stripe` dep is installed but unused — keys in `.env` are blank).

## Commands

```bash
npm run dev              # Next dev server
npm run build            # Next production build
npm run start            # Run the built app
npm run lint             # next lint

npx prisma db push       # Sync DB to schema.prisma (the project's canonical flow — no migrations/ dir)
npx prisma generate      # Regenerate client after schema edits
npx prisma studio        # Browse DB
```

> **DB sync flow:** This project uses `prisma db push`, not formal migrations. There is no `prisma/migrations/` directory and no `_prisma_migrations` table. `schema.prisma` is the source of truth; `db push` reconciles the DB to match it. `deploy.sh` runs `db push --accept-data-loss` on every deploy, so schema changes committed to `main` apply automatically. **TODO:** formalize migrations (baseline with `migrate diff` + `migrate resolve --applied`) once the schema stabilizes — gives rollback history and safer destructive changes.

There is **no test runner configured**. Ad-hoc check/seed scripts live at the repo root (`check-*.js`, `test-*.js`, `seed-catalog.js`, `update-catalog.js`) and under `scripts/` (`seed-plans.ts`, `backup.ts`, `check-payment.ts`). Run TS scripts with `npx tsx scripts/<name>.ts`.

## Architecture

### App Router layout

All real routes live under **`app/`**. A nearly-empty `src/app/` directory also exists from an earlier scaffold — don't add new routes there; treat it as legacy. Many files have `.bak*` / `.bak-2026*` siblings from manual pre-edit backups; ignore them when searching (`grep -v '\.bak'`).

Top-level pages: `/` (home), `/motos`, `/motos/[id]`, `/publicar`, `/mis-motos`, `/perfil`, `/admin`, `/pago/resultado`, plus static pages (`/ayuda`, `/contacto`, `/terminos`, `/politica-*`, `/precios`).

API routes are under `app/api/**/route.ts`:
- `auth/[...nextauth]`, `auth/registro`, `auth/verify-email`, `auth/resend-verification`, `auth/check-email`, `auth/check-verified`
- `listings` (create free / list), `listings/[id]`, `listings/draft`
- `mis-motos`, `mis-motos/[id]` — user's own listings
- `pagos/iniciar`, `pagos/confirmar`, `pagos/[paymentId]` — payment flow
- `catalog/brands`, `catalog/models` — `MotoBrand`/`MotoModel` catalog
- `banners`, `banners/[id]` — returns a random active banner and logs an impression
- `admin/{banners,motos,stats,usuarios}` — gated with `requireAdmin()`
- `upload`, `contacto`, `plans`, `user/{profile,payments,change-password,delete-account}`

### Domain modules (`lib/`)

- **`prisma.ts`** — singleton Prisma client (reused across hot reloads via `globalThis`). Import `prisma` from `@/lib/prisma` everywhere; do **not** instantiate `new PrismaClient()` ad-hoc in app code.
- **`auth.ts`** — exports `authOptions`. Google + Credentials (bcrypt). Sends a welcome email on user create. JWT callback stamps `role` onto the token.
- **`admin-auth.ts`** — `requireAdmin()` helper for admin API routes. Returns `{ ok, userId } | { ok:false, status, error }` — API routes must early-return a JSON response on `!ok`.
- **`plans.ts`** — plan catalog read from DB with **in-memory cache**. After any admin write to the `Plan` table, call `invalidatePlansCache()`. Also owns date math (`calcExpiresAt`, `calcFeaturedUntil`) and the **free-plan cooldown** check (`canPublishFreePlan`, backed by `User.lastFreePublicationAt`).
- **`payphone.ts`** — PayPhone Cajita client. `generateClientTxId()` mints a `MP-...` id; `confirmTransaction()` POSTs `/button/V2/Confirm`. Has a **special case**: PayPhone returns an HTML "Runtime Error" page when the user rejects payment in the app — that is treated as `Canceled`, not an error.
- **`emails.ts`** — Resend templates (welcome, email verification, moto publicada). Senders always use `noreply@motopatio.com`.
- **`banners.ts`** — `pickBanner(position)` picks a random active banner for a slot (`hero | mid_left | mid_right`) and fire-and-forgets an impression row.
- **`picoyplaca.ts`** — Quito vehicle circulation restriction ("Pico y Placa") helpers. Only applies to Quito; other cities return `aplica:false`.
- **`provincias-ecuador.ts`** — static list of Ecuadorian provinces/cities for form pickers.

### Listing publication flow

This is the main business-logic path and is split across two entry points depending on whether the plan is paid:

1. **Free plan (`planId === 'gratis'`, `priceCents === 0`)**
   `POST /api/listings` → validates cooldown via `canPublishFreePlan` → creates `Listing` directly → updates `User.lastFreePublicationAt` → sends "moto publicada" email.

2. **Paid plan (`basico`, `full`, …)**
   a. `POST /api/pagos/iniciar` — creates a `Payment { status: 'pending' }`, stashes the `listingDraft` JSON in `payphoneRawResponse`, returns Cajita config (token, storeId, clientTransactionId, amount) so the frontend can render PayPhone's widget.
   b. User pays; PayPhone redirects back to `GET /api/pagos/confirmar?id=…&clientTransactionId=…`.
   c. Confirm handler is **idempotent** (returns early if `Payment.status === 'approved'`), calls `confirmTransaction`, updates the `Payment`, and on `Approved` creates the actual `Listing` from the stashed draft and links `Payment.listingId`.

**Do not create paid listings through `POST /api/listings`** — it rejects them with `402`. The draft is the source of truth until payment confirms.

### Data model notes (`prisma/schema.prisma`)

- `Listing.fotos` and `Listing.extras` are **`String @db.Text` holding JSON** — always `JSON.stringify` on write and `JSON.parse` on read. They are not Prisma `Json` columns.
- `Listing.planTipo` (string) and `Listing.planId` (FK to `Plan`) both exist and should be kept in sync when writing.
- Payment uniqueness is on `clientTransactionId`; `payphoneTransactionId` is the id assigned by PayPhone after confirm.
- Banner impressions/clicks are counted via dedicated `BannerImpression` / `BannerClick` rows — don't add counter columns to `Banner`.
- `MotoBrand` / `MotoModel` drive the catalog dropdowns in `/publicar`. Seed/update with `seed-catalog.js` / `update-catalog.js` at the repo root.

### Images

`next.config.js` only allows `res.cloudinary.com`, `lh3.googleusercontent.com` (Google avatars), and `motopatio.com` as remote image hosts. Add new hosts there before using `<Image src>` with them.
