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
7. Use **Copy client link** to send that exact menu to guests, or **Use this menu** to publish it on the main website link.

The client link contains the structured menu configuration. Saved menu versions also live in the `Menus` tab of the existing Google Sheet, so they are available across browsers and admin devices. The Published badge identifies the menu shown by the main website link. Historical menus remain available for their existing orders.

The main website URL opens the PPN Christmas menu for 9 December 2026 until a different menu is published. Explicit client links still open their own menu. The original 2025 menu remains available in Admin for historical orders; rows without a menu ID always belong to that original menu.

## One-time shared-menu setup

1. Open the Google Apps Script project attached to the order spreadsheet. Replace its `Code.gs` with [google-apps-script/Code.gs](google-apps-script/Code.gs). This retains order submission and adds shared menus.
2. Generate a different 32-byte secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. In Apps Script **Project Settings → Script properties**, add `MENU_WRITE_SECRET` with that value.
4. In Vercel **Project Settings → Environment Variables**, add `MENU_WRITE_SECRET` with exactly the same value for Production. Redeploy the Vercel project so the variable reaches the server.
5. In Apps Script **Deploy → Manage deployments**, edit the existing Web app deployment, select a new version, and deploy. Keep **Execute as: Me** and **Who has access: Anyone**. If Google gives you a new `/exec` URL, set `ORDERS_SCRIPT_URL` in Vercel to that URL and redeploy.
6. Check `/api/menus` on the website. A working response has `available: true`. Sign in as admin, choose **Menus**, then press **Use this menu** on the PPN version once to add it to the shared sheet. A fresh incognito window should then show it. Future menu imports can be saved and published from the website.

The website requires the admin session for menu writes. Vercel forwards those writes to Apps Script with the private `MENU_WRITE_SECRET`; that secret is never included in browser code. If Google is unavailable, Save and Use show an error and the menu remains unchanged.

## Admin access on Vercel

The menu importer, saved menu versions, and orders dashboard are protected by a server-verified admin session. In the Vercel project, add these environment variables for Production, Preview, and Development:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password-of-at-least-12-characters
ADMIN_SESSION_SECRET=at-least-32-random-characters
MENU_WRITE_SECRET=a-different-32-byte-random-secret
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
