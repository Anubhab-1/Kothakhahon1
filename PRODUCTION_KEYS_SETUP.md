# Production Keys Setup

This project now expects one clean set of environment variables for local development and one for production.

Use this order:

1. Generate `ADMIN_SESSION_SECRET`
2. Keep local PostgreSQL for development
3. Create production Postgres on Neon
4. Create Razorpay test keys
5. Create Cloudinary credentials
6. Add and verify a Resend sending domain
7. Put production values into Vercel and redeploy

## Exact env vars this app uses

```env
NEXT_PUBLIC_SITE_URL=
DATABASE_URL=
DIRECT_URL=
ADMIN_SESSION_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
ADMIN_NOTIFICATION_EMAIL=
```

## What each variable should contain

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, `https://yourdomain.com` in production | Public, safe to expose |
| `DATABASE_URL` | Local Postgres URL or Neon pooled URL | Runtime database connection |
| `DIRECT_URL` | Same local URL or Neon direct URL | Used for Prisma migrations |
| `ADMIN_SESSION_SECRET` | Random 32+ byte secret | Server-only |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Server uses it to create orders |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Server-only, never expose |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same Razorpay Key ID | Sent to browser checkout |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Safe to expose in frontend config |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Server-only in this app |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Server-only, never expose |
| `RESEND_API_KEY` | Resend API key | Server-only |
| `RESEND_FROM_EMAIL` | Verified sender like `Kothakhahon <updates@yourdomain.com>` | Required for production sending |
| `ADMIN_NOTIFICATION_EMAIL` | Admin inbox like `editor@yourdomain.com` | Optional, recommended |

## 1. Generate `ADMIN_SESSION_SECRET`

Run this in the project root:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Paste the output into:

```env
ADMIN_SESSION_SECRET=your-generated-secret
```

Do not reuse the local example secret in production.

## 2. Local development values

For local development, keep the repo-local Postgres instance:

```bash
npm run db:local:setup
```

Your local `.env.local` can look like this:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres@localhost:54329/kothakhahon_dev?schema=public
DIRECT_URL=postgresql://postgres@localhost:54329/kothakhahon_dev?schema=public
ADMIN_SESSION_SECRET=replace-with-your-generated-secret

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
```

After editing `.env.local`:

```bash
npm run prisma:push
npm run build
```

Then sign in to `/admin` and check the launch-readiness panel.

## 3. Production Postgres on Neon

For production, use Neon.

What to do:

1. Create a Neon project.
2. Open the Neon project dashboard.
3. Click `Connect`.
4. Choose your branch, database, and role.
5. Copy two connection strings:
   - pooled connection string: use for `DATABASE_URL`
   - direct connection string: use for `DIRECT_URL`

Use this mapping:

```env
DATABASE_URL=postgresql://user:password@ep-...-pooler....neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@ep-....neon.tech/dbname?sslmode=require
```

Use the pooled URL for runtime because this app runs on Next.js/Vercel.
Use the direct URL for Prisma migrations.

## 4. Razorpay keys

Start with Test Mode first.

What to do:

1. Log in to Razorpay Dashboard.
2. Switch to `Test` mode.
3. Go to `Account & Settings` -> `API Keys`.
4. Click `Generate Key`.
5. Download and save the key details immediately.

Set them like this:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-test-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

In this app:

- `RAZORPAY_KEY_ID` is used server-side to create Razorpay orders
- `RAZORPAY_KEY_SECRET` is used server-side to verify signatures
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is used in the browser checkout flow

When you are ready to go live:

1. Add your website details in Razorpay if Live key generation is blocked.
2. Wait for Razorpay website verification if required.
3. Switch to `Live` mode.
4. Generate live keys.
5. Replace the three test values in Vercel production envs only.

## 5. Cloudinary keys

This project now supports direct admin image uploads through Cloudinary.

What to do:

1. Log in to Cloudinary.
2. Copy the cloud name from the dashboard.
3. Open `Settings` -> `API Keys`.
4. Copy the API key and API secret.

Set them like this:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Notes:

- The app uploads to Cloudinary using a signed server-side request.
- `CLOUDINARY_API_SECRET` must never be exposed publicly.
- Once these three values are set, the admin image upload buttons will start working.

## 6. Resend key

Set this up after you decide your production domain.

Recommended approach:

1. Use a mail subdomain such as `updates.yourdomain.com` or `mail.yourdomain.com`.
2. In Resend, add the domain.
3. Add the DNS records Resend gives you.
4. Wait for SPF and DKIM to verify.
5. Create an API key with `Sending access` restricted to that domain.

Set it like this:

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Kothakhahon <updates@yourdomain.com>
ADMIN_NOTIFICATION_EMAIL=editor@yourdomain.com
```

Important:

- This repo now sends transactional emails for contact, manuscript, newsletter, and paid-order events.
- `RESEND_FROM_EMAIL` should use a verified domain or subdomain in Resend.
- If `ADMIN_NOTIFICATION_EMAIL` is empty, the app falls back to active admin user emails in the database.

## 7. Production values in Vercel

When the service keys are ready:

1. Open your Vercel project.
2. Go to `Settings` -> `Environment Variables`.
3. Add each variable for the correct environment.
4. Save.
5. Redeploy.

Use production values at least for:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
DATABASE_URL=...
DIRECT_URL=...
ADMIN_SESSION_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
ADMIN_NOTIFICATION_EMAIL=...
```

After deployment:

1. Open `/admin`
2. Check the launch-readiness panel
3. Confirm `Canonical Site URL`, `Production Database`, `Transactional Email`, `Razorpay`, and `Image Uploads`

## Recommended rollout

Do this in order:

1. Local secret
2. Neon production database
3. Cloudinary keys
4. Vercel production envs
5. Domain attach
6. Resend domain and verified sender
7. COD checkout smoke test on production
8. Razorpay test/live keys only when online payment is ready

## Sources

- Neon: https://neon.com/docs/get-started/connect-neon
- Razorpay test/live modes: https://razorpay.com/docs/payments/dashboard/test-live-modes/
- Razorpay API keys: https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/
- Cloudinary credentials: https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials
- Cloudinary upload base URL: https://support.cloudinary.com/hc/en-us/articles/23687620947730-How-To-Find-the-API-Base-URL
- Resend API keys: https://resend.com/docs/dashboard/api-keys/introduction
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- Vercel environment variables: https://vercel.com/docs/environment-variables/managing-environment-variables
