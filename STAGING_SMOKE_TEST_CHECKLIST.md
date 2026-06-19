# Staging Smoke Test Checklist

> Run this verification suite on the staging environment before deploying to production.

---

## 1. Authentication & Member Accounts
- [ ] **Email Signup**: Register a new user with a valid email. Verify the sign-up form rejects invalid email layouts and password mismatches.
- [ ] **Email Verification Flow**:
  - Check the database or admin email queue for the verification token.
  - Visit the verification URL and ensure the user's status updates to verified.
  - Attempt login with unverified email; ensure it blocks access with an instruction.
- [ ] **Profile Settings**: Update name and phone number on the `/account` profile page. Verify changes persist on reload.
- [ ] **Address Book**:
  - Add a new shipping address; verify District and State are populated on India PIN code input.
  - Edit/delete an address, and toggle the "Default Address" flag.

---

## 2. Book Catalog, Search & Reviews
- [ ] **Catalog Filters**: Filter books by Genre, Author, Language, and Price Range. Verify the layout dynamically adjusts.
- [ ] **Interactive Search**:
  - Search for terms; verify results render correctly.
  - Clear the input; check that "Recent Searches" and "Trending Queries" appear.
- [ ] **Book Detail page**:
  - Verify SPECIFICATIONS, TABLE OF CONTENTS, and CHAPTER PREVIEW sections toggle correctly.
  - Toggle Heart button to check wishlist addition/removal.
- [ ] **Reader Reviews**:
  - Open a book page as an anonymous guest; verify the sign-in redirect card renders.
  - Log in, open the same page; verify the submission form renders with your name pre-filled.
  - Submit a review; confirm the pending moderation banner appears.
  - Log in as ADMIN, visit `/admin/reviews`, approve the review, and check that it is now public on the book page.

---

## 3. Shopping Cart & Checkout
- [ ] **Guest Cart Merging**:
  - Add 2 items to the bag as a guest.
  - Log in; visit `/books` or `/checkout` and verify that the items merged into your database cart.
- [ ] **Checkout Validation**:
  - Step 1: Confirm email and contact info.
  - Step 2: Choose shipping (Standard ₹70/Free over ₹999 vs Express ₹150 flat). Verify totals recalculate dynamically.
  - Step 3: Input a coupon code (e.g. `WELCOME50` or flat discount). Verify the discount line appears in the total.
  - Step 4: Choose COD or Online payment (Razorpay).
- [ ] **Idempotent Webhooks**:
  - Verify that hitting verify or webhook callback endpoints repeatedly does not create duplicate orders or deduct inventory multiple times.

---

## 4. Receipts, Timeline & Invoices
- [ ] **Checkout Success Screen**: Check that the checkout success receipt displays:
  - Detailed subtotal, shipping fee, coupon discount, and amount due/paid.
  - Estimated delivery milestone days (2-3 days for Express, 5-7 days for Standard).
- [ ] **PDF Invoice**: Click "Download Invoice" on the checkout success or order details page. Ensure a valid, styled PDF is downloaded.
- [ ] **Member Order Timeline**: View the order under `/account/orders/[id]`. Confirm it displays the current status milestone matching the admin dashboard database values.

---

## 5. Admin Operations Control
- [ ] **Commerce KPI Dashboard**: Verify Total Revenue, Conversion Rate (orders/interactions), and Top Sellers leaderboard render live calculations.
- [ ] **Inventory Warning Banner**: Verify books with stock < 10 copies appear in the low-stock admin warnings grid.
- [ ] **Email Queue Drain**:
  - Go to `/admin/email-jobs`.
  - Trigger/run pending emails and verify status updates to `completed`.
