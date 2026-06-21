# nodeadline — Frappe app (marketing site)

The nodeadline.ie marketing site, rebuilt as a **custom Frappe app** so it runs on
the same ERPNext / Frappe stack we sell. The landing page is a standalone web page
served by Frappe; the lead form and the business‑map quiz create a real **Lead** in
ERPNext (dogfooding).

Deployed on **Frappe Cloud** as a bring‑your‑own app.

## What's here

```
pyproject.toml                     flit build + Frappe Cloud metadata
nodeadline/
├── __init__.py                    __version__ (read by flit)
├── hooks.py                       app metadata, home_page, favicon
├── api.py                         create_lead — Guest endpoint → ERPNext Lead
├── modules.txt / patches.txt
├── www/
│   ├── index.html                 the landing page (served at "/")
│   └── index.py                   page context (year, CSRF token)
├── public/
│   ├── css/nodeadline.css         design system
│   ├── js/
│   │   ├── logo.js                matrix wordmark
│   │   ├── site.js                lead-form submit + commission swipe bar
│   │   ├── quiz.js                12-tap quiz → Cytoscape map → Lead
│   │   └── cytoscape.min.js       vendored (3.30.2) — no CDN at runtime
│   ├── data/quiz.json, rules.json quiz + map rules
│   └── images/favicon.svg
└── nodeadline/                    module folder (no doctypes yet)
```

The page is a complete HTML document, so Frappe renders it as‑is — no default
navbar/footer/sidebar. Static assets are raw files under `public/`, served at
`/assets/nodeadline/...` (no bundling, nothing to build).

## Lead capture

`POST /api/method/nodeadline.api.create_lead` (Guest, rate‑limited 6/hour per IP+email).
Creates an ERPNext **Lead** (`status="Lead"`, `source="Website"` if that Lead Source
exists) and attaches the message + 12 quiz answers + computed map as a **CRM Note**.
Requires ERPNext on the same site; if `Lead` is missing it returns a soft error and
the front‑end falls back to email. Protected with a honeypot field + CSRF token.

> Optional upgrade: to make the quiz answers queryable, add a `Long Text` Custom
> Field `custom_quiz_data` on Lead, export it as a fixture, and write to it in
> `api.py`. Not required — the CRM Note already captures everything.

## Deploy to Frappe Cloud

1. **Push** this repo to GitHub (branch `rewrite/frappe`, or merge to `main`).
2. **Authorize** the *Frappe Cloud* GitHub App for the repo if it's private:
   <https://github.com/settings/installations/> → Configure → add the repo.
3. **Add the app** to your bench: Frappe Cloud → your **Bench Group** → *Apps* →
   **Add App** → *Add from GitHub* → pick the repo + branch.
4. **Deploy**: the bench group shows *Update Available* → click it → select your
   site → **Deploy and Update** (~10–20 min, brief downtime at cutover).
5. **Install on the site**: Site → *Apps* → **Install App** → `nodeadline`.
6. Visit the site root `/` — the landing page should render.

To ship changes later: push to the tracked branch → bench group shows
*Update Available* → *Deploy and Update* (runs `bench migrate` automatically).

### Requirements
- Frappe **v15** bench (declared in `pyproject.toml` → `[tool.bench.frappe-dependencies]`).
- **ERPNext** installed on the same site (for the `Lead` doctype). Optional but
  recommended — without it the lead form degrades to email.

## Custom domain (nodeadline.ie)

Migrating from GitHub Pages to the Frappe Cloud site:

1. In Frappe Cloud: Site → **Domains** → *Add Domain* for both `nodeadline.ie` and
   `www.nodeadline.ie`. Set one as **Primary** and enable redirect on the other.
   Read the site's **Inbound IP** from the dashboard.
2. **DNS changes** at the registrar:
   - **Remove** the four GitHub Pages A records
     (`185.199.108.153 / .109.153 / .110.153 / .111.153`) and the four AAAA records
     (`2606:50c0:8000::153 / 8001::153 / 8002::153 / 8003::153`), plus any old
     `www` CNAME pointing at `*.github.io`.
   - **Add** `A  @  → <Inbound IP>` and `CNAME  www  → <your-site>.frappe.cloud`.
   - If using Cloudflare, set the records to **DNS only** (grey cloud) — the proxy
     breaks Frappe Cloud custom domains / SSL.
3. SSL (Let's Encrypt) is issued automatically once DNS verifies (a few minutes).
4. **Disable GitHub Pages** on the repo so it stops claiming the domain.

> The old `/CNAME` file and `.github/workflows/deploy-pages.yml` were GitHub‑Pages
> only and have been removed.

## Local development (optional, needs a bench)

```bash
bench get-app nodeadline /path/to/this/repo   # or the GitHub URL
bench --site <yoursite> install-app nodeadline
bench build --apps nodeadline
bench --site <yoursite> clear-cache
```

Bump the `?v=N` query on the CSS/JS `<link>`/`<script>` tags in `www/index.html`
after editing those raw assets, so browsers pick up the change.
