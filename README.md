# F&V Menu Studio

A Vite + React website for turning restaurant menu files into shareable guest ordering pages.

## Run locally

```bash
npm install
npm run dev
```

## Create a menu version

1. Sign in through **Admin**.
2. Open **Menus**.
3. Select **New menu**.
4. Import a picture, PDF, or text file. Pictures and scanned PDFs are read with OCR in the browser.
5. Review the detected starters, main courses, desserts, dietary tags, prices, and event date.
6. Save the version.
7. Use **Copy client link** to send that exact menu to guests.

The client link contains the structured menu configuration, so it works on another device without relying on that device's browser storage. Saved admin versions remain in local browser storage for quick reuse.

## Admin access on Vercel

The menu importer, saved menu versions, and orders dashboard are protected by a server-verified admin session. In the Vercel project, add these environment variables for Production, Preview, and Development:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password-of-at-least-12-characters
ADMIN_SESSION_SECRET=at-least-32-random-characters
```

Generate a suitable session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Redeploy after adding or changing the variables. `npm run dev` grants local admin access automatically; deployed builds always require the server-side login.

## Orders

Orders are read from the configured Google Sheet in `src/App.jsx`. Submissions go through `api/orders.js`, which checks the Apps Script JSON response before confirming a save. A failed request or an unconfirmed response never displays success. New rows contain:

1. Guest name
2. Course count
3. Starter ID
4. Main ID
5. Dessert ID
6. Cooking preference
7. Order date
8. Menu version ID
9. Menu title

Add `Menu ID` and `Menu Title` as the final two headers in the `Orders` sheet. Older seven-column orders are treated as orders for the original Christmas menu.

If the Google Apps Script deployment URL changes, set `ORDERS_SCRIPT_URL` in Vercel to the new `/exec` URL and redeploy. The script must accept the existing `sheetId`, `sheetName`, and `values` payload and return JSON with `status: 'success'` only after appending the row. Local submission testing requires a runtime that serves the Vercel API routes; the plain Vite dev server only serves the frontend. Do not retry timed-out submissions automatically: check the sheet first because the append may already have completed.

## Checks

```bash
npm run lint
npm run build
```
