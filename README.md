# Nodeadline landing page

Static GitHub Pages website for nodeadline.ie.

## Files

- index.html
- pay.html (consulting offer + payment landing page)
- styles.css
- script.js
- pay.js
- CNAME

## Payment landing page (pay.html)

A one-time €3,650 consulting offer. The site is fully static (GitHub Pages),
so payment goes through hosted providers — no backend required. Two methods
are wired up; fill in the placeholders for whichever you use.

### Option A — Card payment via Stripe (recommended)

1. Create a Stripe account and connect your **AIB business IBAN** for payouts.
2. In the Stripe Dashboard, create a **Payment Link** for €3,650 (EUR),
   one-time.
3. Set the link's post-payment redirect to:
   `https://nodeadline.ie/pay.html?paid=1`
   (and, if you set a cancel URL, `https://nodeadline.ie/pay.html?cancelled=1`).
4. In `pay.html`, replace `REPLACE_WITH_STRIPE_PAYMENT_LINK` (the `href` of
   the `#payBtn` button) with your Payment Link URL.

No secret or publishable keys live in this repo — a Payment Link is just a URL.
Stripe shows a receipt and the buyer is redirected back to the thank-you banner.

### Option B — SEPA bank transfer to AIB (zero card fees)

In `pay.html`, replace these placeholders with your AIB details:

- `REPLACE_WITH_ACCOUNT_NAME`
- `REPLACE_WITH_IBAN`
- `REPLACE_WITH_BIC`

Buyers reveal these via the "Prefer a bank transfer?" toggle and pay manually.
Reconciliation is manual — match incoming transfers by the reference shown.

## Deploy via GitHub Pages

1. Push this folder as a GitHub repository.
2. Ensure default branch is main.
3. In repository settings:
   - Open Pages.
   - In Build and deployment, choose Source: GitHub Actions.
4. Push any commit to main to trigger deployment.

## Connect custom domain nodeadline.ie

The CNAME file is already configured with nodeadline.ie.

Configure DNS at your domain provider:

- Type: A, Host: @, Value: 185.199.108.153
- Type: A, Host: @, Value: 185.199.109.153
- Type: A, Host: @, Value: 185.199.110.153
- Type: A, Host: @, Value: 185.199.111.153
- Type: AAAA, Host: @, Value: 2606:50c0:8000::153
- Type: AAAA, Host: @, Value: 2606:50c0:8001::153
- Type: AAAA, Host: @, Value: 2606:50c0:8002::153
- Type: AAAA, Host: @, Value: 2606:50c0:8003::153
- Optional: Type: CNAME, Host: www, Value: nodeadline.ie

After DNS propagates, enable Enforce HTTPS in GitHub Pages settings.
