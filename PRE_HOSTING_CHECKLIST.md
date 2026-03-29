# Pre-Hosting Checklist

Use this checklist before pointing the live domain at the production deployment.

## Environment
- Set `NEXT_PUBLIC_SITE_URL` to the real production domain.
- Move `DATABASE_URL` and `DIRECT_URL` to managed PostgreSQL.
- Set a strong `ADMIN_SESSION_SECRET`.
- Set Cloudinary keys and confirm admin uploads work.
- Set `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`.
- Add Razorpay keys only when online payment is ready to ship.

## Public Smoke Test
- Home, catalog, author, journal, about, contact, and policy pages return `200`.
- Header search, catalog filters, add-to-cart, cart drawer, and checkout all work.
- COD checkout completes and reaches the success page.
- Social metadata resolves to the generated Open Graph image.
- `robots.txt` and `sitemap.xml` reflect the production domain.

## Account And Auth
- Customer registration and login route to `/account`.
- Admin login routes to `/admin`.
- Customers cannot access `/admin`.
- Order history shows signed-in orders and older guest orders on the same email.
- `/account/orders/[id]` only loads orders owned by the signed-in customer or legacy guest orders on the same email.

## Admin Smoke Test
- Create, edit, and delete a book.
- Create, edit, and delete an author.
- Create, edit, and delete a journal post.
- Upload a cover image from admin.
- Search and page through books, authors, orders, inbox, manuscripts, and newsletter lists.
- Update both fulfillment state and payment state on an order.

## Email And Payments
- Contact form sends confirmation and admin notification emails.
- Manuscript form sends confirmation and admin notification emails.
- Newsletter signup sends confirmation and admin notification emails.
- COD order sends both customer and admin email.
- If Razorpay is enabled, complete one full test payment and verify the paid order email.

## Production Review
- Replace any remaining placeholder support details with real phone, address, and email information.
- Review homepage, book pages, checkout, and account copy on mobile and desktop.
- Confirm the launch-readiness panel shows only expected warnings.
