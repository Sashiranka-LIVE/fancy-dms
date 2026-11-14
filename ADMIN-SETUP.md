# DMS Fancy Shop — Supabase admin setup

Status: Supabase schema, 14-product import and approved owner confirmed. Public catalog reads and anonymous write/upload denial verified. Owner login and upload still need a real signed-in check.

## 1. Project

Use your existing **DMS FANCY-SHOP** Free project. Keep the database password private. The app does not need it.

## 2. Create tables and import the collection

In Supabase → SQL Editor → New query:

1. Paste and run `supabase-schema.sql`. This creates the product table, the single-owner authorization rules and public product-image bucket.
2. In another query, paste and run `supabase-seed.sql`. This imports the existing 14 products, preserving their images, prices and order. Re-running the seed does not overwrite existing IDs.

Use a dedicated project. The scripts assume no other permissive product/storage policies exist. Never disable Row Level Security.

## 3. Create your admin login

In Authentication → Users → Add user / Create new user, create an email/password user for yourself. Enable email confirmation for this manually created account if the dialog offers it. This is your store admin login, distinct from signing into the Supabase dashboard with GitHub.

In Authentication settings, disable **Allow new users to sign up**. Keep email/password sign-in enabled. The website has no public signup form.

Copy your new user's UUID from Authentication → Users. In SQL Editor, run:

```sql
insert into private.shop_owner (singleton, user_id)
values (true, 'REPLACE-WITH-YOUR-AUTH-USER-UUID'::uuid);
```

Only one owner can be inserted. Do not use your GitHub account ID. If changing the owner intentionally later, update the existing singleton row in SQL Editor.

Keep your password in your password manager; do not put it in code or chat. This first version keeps sessions in memory, so a page refresh requires signing in again. If you forget the password, reset/update the user through your Supabase dashboard; self-service password recovery is not configured here.

## 4. Connect the app

Project → Connect dialog provides Project URL and publishable key. Settings → API Keys also lists publishable keys.

Edit `admin-config.js`:

```js
window.DMS_ADMIN_CONFIG = Object.freeze({
  enabled: true,
  url: 'https://YOUR-PROJECT.supabase.co',
  publishableKey: 'sb_publishable_YOUR-PUBLIC-KEY'
});
```

Use a URL with no trailing slash. Only the new publishable key format is accepted. Never use a secret key, service_role key or database password. The public key does not grant product-editing rights; database policies enforce ownership.

The supplied public settings now have `enabled: true` after schema, seed and owner setup. Disabled or blank settings retain the original static collection. Once connected, empty or failed catalog requests never show stale fallback products. Failed requests show a retry message.

## 5. Verify before publishing

Run `supabase-policy-check.sql` in SQL Editor after owner setup. It rolls all test data back and raises an error if the database access checks fail.

Then serve locally (`npm start`, http://127.0.0.1:4173/admin.html):

- Sign in with your store admin email/password. Confirm all 14 original listings.
- Add a hidden test product with a background-removed PNG/WebP, verify it appears only in the manager.
- Publish it, refresh the storefront, then edit its price and verify the changed card.
- Hide it and refresh the storefront; it must disappear. Keep any test items hidden.
- Check an Ask for price product opens the order number 0712150911.
- In a separate signed-out session, verify products can be read but product inserts/updates and image uploads are denied.
- Check a non-owner authenticated account is rejected too. The SQL check covers database denial; perform real Auth/Storage checks before treating the integration as production-verified.
- Check desktop and mobile layouts with real browsers.

Publish the complete code, config and assets together only after these checks. The admin URL is the store base URL plus `admin.html`. No private credentials should be in the public repository.

## Day-to-day use

Use **Add product** or **Edit listing**, choose category, set price or Ask for price, then check the live card preview. **Delete** permanently removes a listing after confirmation; the image file remains in Storage. New products start Hidden / draft. Set Visible in store when ready. Smaller Display order values appear first.

Use product-only transparent PNG/WebP images up to 5 MB and 100–8000 pixels per side. Upload does not automatically remove a poster background. The manager uses the existing cream product-card background, typography and image containment.

Replacing an image uses a new storage filename. Existing images are not deleted automatically. An upload followed by a failed save can leave an unused image; delete it manually in Storage only after confirming no product uses it. Public product images remain accessible by URL even when a listing is hidden. Never upload private files.

Open the store and refresh it to see saved changes. Existing shopping bags are checked against current prices/visibility before opening an order inquiry. If prices or items changed, customers review the updated bag first.

If a save reports a conflict or uncertain network failure, refresh the product list before retrying. For a new product, the same draft ID is reused on retry to prevent duplicate inserts. Unsaved text may be lost on refresh: copy it first.

## Free plan inactivity

Supabase may pause Free projects with low user database activity over a seven-day period. Its official guidance says a few user database requests each day are typically sufficient, but this is not a guarantee.

- Use the store/admin normally. Loading the connected collection and refreshing the manager query the product database.
- Check the email account that owns the Supabase project for pause warnings. Visit the project dashboard and use the connected app if a warning arrives.
- If paused, open the project dashboard and choose **Resume project**. Until restored, the collection shows a retry state.
- Supabase Pro is the supported way to avoid automatic inactivity pausing; it currently starts at USD 25/month, with usage-related costs possible. No paid plan has been enabled by this implementation.
- No artificial keep-alive job or recurring billing has been configured.

Official guidance: https://supabase.com/docs/guides/platform/free-project-pausing
Pricing: https://supabase.com/pricing

## Backups and verification limits

Keep the source project and asset archive. Export the product table from Supabase regularly and separately back up uploaded storage files; the original seed only contains the initial catalog. Before changing any database policy, verify anonymous and non-owner requests still cannot write.

Local JavaScript tests use mocked APIs. The schema and RLS assertions also passed in a local PostgreSQL engine with simulated Supabase auth/storage schemas. These do not prove live Supabase Auth/Storage HTTP behavior. Run the SQL policy checks and the live checks above on your project. Refer to the delivery message for deployment status.


## Celimax Retinal Shot listing

The prepared image is published as `assets/celimax-retinal-shot-clean.webp`. Run `supabase-add-celimax-and-delete.sql` once to enable owner-only deletion and add Celimax Retinal Shot Tightening Booster (20 g), LKR 6,000, with free delivery.

## Permanent product deletion

Permanent deletion is owner-only and requires confirmation in the manager. Database rows are deleted; public product image files are not automatically deleted. Check their use before manually removing files from Storage. The migration above enables this policy.
