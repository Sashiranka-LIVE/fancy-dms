# DMS Fancy Shop

Responsive beauty and cosmetics storefront with an emerald, gold and ivory design.

## Run locally
Open `index.html`, or run `npm start` and visit `http://127.0.0.1:4173`.

## GitHub Pages
Publish from the `main` branch, `/ (root)` folder in Settings → Pages.
The `.nojekyll` file allows the site to be served as static files without a Jekyll build.
All storefront asset paths are relative, including on a repository Pages URL.

## Orders
The shopping bag creates a WhatsApp inquiry addressed to +94 71 215 0911.
Cash on delivery, bank transfer and pickup are inquiry preferences; the store confirms payment, stock and delivery details. No card payments are collected.

## Editing
- `app.js`: product catalog, prices and WhatsApp number.
- `index.html`: page content and contact information.
- `styles.css`: responsive layout and branding.
- `assets/dms-bag.svg`: transparent handbag and leaf logo.

Product visuals are based on supplied branding and product artwork. Review current product packaging, prices and variant details before accepting orders.


## Product manager

Open `admin.html` and sign in with the approved Supabase Auth email/password. Products are read from Supabase; add/edit/hide listings in the manager. See [ADMIN-SETUP.md](ADMIN-SETUP.md) for setup, image guidelines and access checks. `npm run check` validates JavaScript syntax and `npm test` runs catalog and manager checks. Only public Supabase settings are shipped; ownership is enforced by database/storage policies.


The product manager supports add, edit, visibility changes, and confirmed owner-only deletion. New listings default to hidden. Run `supabase-add-celimax-and-delete.sql` to enable product deletion and add Celimax Retinal Shot Tightening Booster (20 g), LKR 6,000, with free delivery.
