# Kothakhahon Prokashoni Web

Independent Bengali publishing storefront built with Next.js App Router.

Current production direction:
- database-backed catalog and journal content inside the app
- guest checkout with server-side order creation
- COD-first checkout with optional Razorpay online payment
- Prisma + PostgreSQL, with a custom admin workspace
- shared login with reader accounts plus admin role access
- custom internal admin dashboard at `/admin`

See `PRODUCTION_READY_PLAN.md` for the single production roadmap we will implement.

## Tech Stack
- Next.js 16
- React 19
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- Razorpay
- React Hook Form + Zod

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start the local PostgreSQL instance
```bash
npm run db:local:setup
```

### 3. Configure environment
Copy `.env.example` to `.env.local` and fill values.

Required vars:
- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_WEBHOOK_SECRET`

Production-only next vars:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ADMIN_NOTIFICATION_EMAIL` (optional but recommended)
- `EMAIL_JOB_SECRET` (recommended for the protected email job processor route)

### 4. Apply local database schema
```bash
npm run prisma:push
```

### 5. Import the current seed catalog
```bash
npm run content:bootstrap
```

### 6. Create the first admin account
```bash
npm run admin:create -- editor@example.com strong-password "Admin Name"
```

### 7. Start the app
```bash
npm run dev
```

Open `http://localhost:3000`.
Sign in lives at `http://localhost:3000/login`.
Admin accounts are redirected to `/admin`, and reader accounts are redirected to `/account`.

## Production Readiness
- The admin dashboard includes a launch-readiness panel that flags missing domain, managed database, payment, upload, and email-sender configuration.
- Local development now runs against the repo-local PostgreSQL instance on port `54329` by default.
- Before launch, move `DATABASE_URL` to Neon or another managed Postgres instance and set the real production domain.
- If deploying to Vercel with Neon Postgres, ensure `DATABASE_URL` uses the pooled connection string (`?pgbouncer=true`) and `DIRECT_URL` uses the direct connection string for Prisma migrations.
- Admin pages are marked `noindex` and now ship with basic security headers through `proxy.ts`.
- Transactional emails now enqueue into the `EmailJob` table and are processed after the response, with retries available through the protected `GET/POST /api/internal/email-jobs/process` route.
- In production, call that route from cron or an uptime worker with `Authorization: Bearer $EMAIL_JOB_SECRET` so failed email jobs continue draining even when the site is quiet.

## Scripts
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:migrate -- --name <migration-name>`
- `npm run db:local:setup`
- `npm run db:local:start`
- `npm run db:local:stop`
- `npm run content:bootstrap`
- `npm run admin:create -- <email> <password> "Full Name"`

## Current Feature Scope
- Home, books, authors, blog, about, contact, and manuscript pages
- Guest cart with local storage
- COD-first checkout flow with server-authoritative pricing
- Shared login and reader account area with account-linked orders plus guest-order fallback by email
- Admin dashboard for catalog, authors, journal, orders, inbox, newsletter, and settings
- Contact, manuscript, and newsletter persistence via Prisma
- SEO routes: `robots.txt` and `sitemap.xml`

## Not In Launch Scope
- Wishlist
- Public reviews
- Sanity Studio

## Key Paths
- `app/`
- `components/`
- `lib/`
- `prisma/`
- `generated/prisma/client/`
