# Production Rebuild Plan

## Goal

Rebuild this project into a production-ready bookstore and publishing site with:

- one application
- one primary database
- one shared login system with role-based admin access
- real checkout
- no fake/demo flows
- no split CMS
- no half-finished placeholder features in v1

The fastest high-success path is to **remove Sanity and Supabase**, keep the working frontend, and replace the backend/content layer with a simpler stack.

## Final Direction

### Keep

- Next.js App Router
- React
- Tailwind CSS
- Razorpay
- Zod
- React Hook Form

### Replace

- Sanity -> custom admin dashboard
- Supabase -> direct PostgreSQL + Prisma + admin auth

### Add

- PostgreSQL on Neon or Prisma Postgres
- Prisma ORM
- role-based authentication for readers and admins
- Cloudinary for image uploads
- Resend for transactional email

## Launch Scope For V1

### Launch in V1

- Home page
- Books listing
- Book detail pages
- Authors pages
- Blog pages
- About page
- Contact form
- Manuscript submission form
- Newsletter form
- Shared reader login
- Basic customer account dashboard with email-matched orders
- Guest checkout with Razorpay
- Admin dashboard

### Do not launch in V1

- Wishlist
- Public reviews
- Full customer order management
- Password-reset workflow

Those features add complexity and are not required for a professional first launch.

## What I Am Doing Now

These are the changes started in the current cleanup phase:

- remove obvious non-product artifacts
- remove clearly unused dependencies
- write the full rebuild plan into the repo
- prepare the repository for a phased migration instead of patching the current mixed architecture

### Cleanup Done In This Phase

- remove audit artifact files
- remove stale local server log file
- remove unused `styled-components` dependency
- add this plan file

## Execution Plan

## Phase 1: Freeze Scope And Remove Unreliable Features

### Objective

Stop carrying features that make the app look incomplete or unstable.

### Work

- remove the client-side checkout bypass button
- remove all fake success flows
- remove placeholder copy and placeholder content
- disable or remove public review submission
- disable or remove wishlist
- keep guest cart only

### Expected Result

The site becomes smaller, clearer, and safer to launch.

## Phase 2: Replace Sanity And Supabase

### Objective

Move all content and operational data into one database and one admin panel.

### New Backend Stack

- PostgreSQL
- Prisma
- admin-only authentication
- file uploads through Cloudinary

### New Core Tables

- `admin_users`
- `authors`
- `books`
- `book_genres`
- `blog_posts`
- `site_settings`
- `orders`
- `order_items`
- `contact_messages`
- `manuscript_submissions`
- `newsletter_subscribers`

### Notes

- store image URLs instead of raw files in the database
- use Cloudinary public IDs and URLs for cover images and author images
- all editing happens through `/admin`

## Phase 3: Build Custom Admin Dashboard

### Objective

Replace Sanity Studio with a purpose-built internal dashboard.

### Admin Modules

- Dashboard overview
- Books CRUD
- Authors CRUD
- Blog posts CRUD
- Site settings editor
- Orders list and detail
- Contact inbox
- Manuscript inbox
- Newsletter list export

### Admin Routes

- `/admin`
- `/admin/books`
- `/admin/books/new`
- `/admin/books/[id]`
- `/admin/authors`
- `/admin/blog`
- `/admin/orders`
- `/admin/inbox/contact`
- `/admin/inbox/manuscripts`
- `/admin/newsletter`
- `/admin/settings`

### Authentication Rules

- reader and admin accounts share one login page
- only admin users can enter `/admin`
- seed first admin manually
- later allow password reset by email

## Phase 4: Rewrite Data Access Layer

### Objective

Remove fallback-heavy logic and replace it with direct database queries.

### Work

- replace `lib/sanity.ts` with Prisma queries
- replace `lib/supabase/*` with `lib/db.ts` and auth helpers
- rewrite API routes to use Prisma
- remove fallback content arrays from public pages

### Expected Result

- one source of truth
- no duplicate content logic
- no CMS fallback contradictions

## Phase 5: Rebuild Checkout Cleanly

### Objective

Make payment and order creation fully real and auditable.

### Work

- guest cart in local storage
- server-side order creation from authoritative database prices
- Razorpay order creation on the server
- payment signature verification on the server
- order status transitions: `pending` -> `paid` -> `fulfilled`
- admin order management
- confirmation email after payment

### Important Rule

There must be no client-only payment success path.

## Phase 6: Content And UX Polish

### Objective

Make the site feel professional before putting a domain on it.

### Work

- replace weak placeholder author and blog content
- use consistent publication dates
- fix hydration mismatches from locale-based date rendering
- improve mobile layouts for dense data pages
- standardize empty states and error states
- ensure all CTA text is real and intentional

## Phase 7: Production Hardening

### Objective

Prepare the app for real traffic and operational use.

### Work

- add proper environment validation
- add rate limiting on forms and auth
- add server-side logging
- add error monitoring
- add SEO metadata cleanup
- remove auth routes from sitemap if they remain private
- set canonical site URL
- use production domain in all metadata and redirects
- test full payment flow in Razorpay test mode
- add backup/export strategy for database and inbox data

## Phase 8: Launch

### Launch Checklist

- production database created
- Prisma migrations applied
- first admin seeded
- Cloudinary configured
- Resend configured
- Razorpay live keys configured
- domain attached
- SSL verified
- `NEXT_PUBLIC_SITE_URL` set to production domain
- all forms tested on production domain
- checkout tested on production domain
- sitemap and robots verified

## Files And Code To Remove During The Rebuild

These are the main current areas that should be deleted once the replacements are in place.

### Remove Completely

- `sanity/`
- `sanity.config.ts`
- `sanity.cli.ts`
- `app/studio/`
- `lib/sanity.ts`
- `supabase/`
- `lib/supabase/`
- `proxy.ts`

### Remove If V1 Scope Stays Admin-Only + Guest Checkout

- `app/account/`
- `app/auth/`
- `components/ui/WishlistButton.tsx`
- `components/ui/ReviewCard.tsx`
- `components/ui/ReviewForm.tsx`
- `components/ui/ReviewsSection.tsx`
- `app/api/reviews/route.ts`

### Rewrite Instead Of Delete

- `app/page.tsx`
- `app/books/page.tsx`
- `app/books/[slug]/page.tsx`
- `app/authors/page.tsx`
- `app/authors/[slug]/page.tsx`
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/api/checkout/*`
- `app/api/contact/route.ts`
- `app/api/manuscript/route.ts`
- `app/api/newsletter/route.ts`

## New Project Structure Target

```text
app/
  admin/
  api/
  books/
  authors/
  blog/
  checkout/
  contact/
  for-authors/
components/
lib/
  auth/
  db.ts
  env.ts
  payments/
  uploads/
prisma/
  schema.prisma
```

## Acceptance Criteria For Production Ready

The site is production ready when all of the following are true:

- no fake payment or fake order flows exist
- all visible content is real and approved
- there is one shared login and admin access is role-based
- all book, author, and blog content can be managed without code edits
- contact, manuscript, and newsletter submissions are stored reliably
- checkout is fully real in test mode and live mode
- no broken or hidden placeholder features appear in the UI
- mobile and desktop both work cleanly
- production metadata uses the real domain

## Recommended Order Of Work

1. Remove demo and placeholder features from launch scope.
2. Add Prisma + PostgreSQL.
3. Add shared auth with role-based admin access.
4. Build admin CRUD for authors, books, blog posts, and settings.
5. Migrate public pages to Prisma queries.
6. Rebuild forms to Prisma.
7. Rebuild checkout to Prisma + Razorpay.
8. Polish UI content and mobile layouts.
9. Deploy and configure domain.
10. Run full production test pass.

## Immediate Next Step

The next implementation step should be:

**replace the current backend foundation with Prisma + PostgreSQL and set the final V1 feature scope before any more UI work.**

If that step is skipped, the project will keep accumulating patches on top of a backend stack you already do not want to keep.
