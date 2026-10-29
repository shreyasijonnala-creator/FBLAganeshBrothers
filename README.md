# Ganesh Brothers

Website for Ganesh Brothers, an Indian grocery in Ellicott City, MD.

- **Customers** browse the store, build a shopping list, plan recipes, and send the list as a **pickup order**. The page shows the order's status live and alerts them when it's ready.
- **Staff** sign in at `/staff` to see incoming orders (New → Preparing → Ready → Picked up) and **statistics**: most-ordered products, busiest aisles, hours and days, items often bought together, revenue and prep time.

## Run it

Needs [Node.js](https://nodejs.org) 18 or newer. No packages to install.

```sh
npm start          # shop: http://localhost:3000   staff: http://localhost:3000/staff (password gb2026)
npm run demo       # same, and makes sure the sample orders are there
```

The staff password is **gb2026**. To use a different one without changing the code, set `STAFF_PASSWORD` (on Vercel: Settings → Environment Variables). Signed-in staff can see the current password on the dashboard's Settings tab.

## Folders

| Path | What it is |
|---|---|
| `public/` | The customer site. Everything here is public. |
| `public/data/inventory.js` | Every product: brand, name, price, stock, specials. Edit this to change the catalog. |
| `server/app.js` | The server logic: orders, validation, statistics, staff sign-in. |
| `server/server.js` | Runs `server/app.js` on your computer (`npm start`). |
| `server/storage.js` | Saves data to Upstash Redis on Vercel, or to JSON files locally. |
| `api/app.js`, `vercel.json` | Run the same server on Vercel. |
| `server/staff.html`, `server/login.html` | Staff pages. Served only through `/staff` after signing in — never as public files. |
| `server/orders.json` | Saved orders (created automatically, not committed). |
| `tools/make-art.js` | Draws the product pictures in `public/images/`. Run `npm run art` after editing the inventory. |

## Put it online with Vercel (shop + staff dashboard)

1. Push this repo to GitHub, then on [vercel.com](https://vercel.com) choose **Add New → Project** and import it. Leave the settings as they are — `vercel.json` already sets everything up — and click **Deploy**.
2. Optional — in the project, open **Settings → Environment Variables** and add:
   - `STAFF_PASSWORD` — optional; replaces the built-in password **gb2026** (recommended, since the repo is public).
3. Open **Storage**, add **Upstash Redis** (free tier), and connect it to the project. This is where orders are saved. Without it everything still works, but saved orders can reset now and then.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new settings take effect.

A new deployment starts with test information — 95 sample orders (5 still in progress) — so the order board and statistics have data. Staff can clear it with **Remove demo orders** on the Statistics tab, and it won't come back. Set `SEED_DEMO` = `0` to start empty instead.

Customers use `https://your-project.vercel.app/`. Staff click the logo or go to `/staff`.

How it fits together: Vercel serves `public/` as the shop. `vercel.json` sends `/staff/...` and `/api/orders/...` to `api/app.js`, which runs the same server code as `npm start` (`server/app.js`). `server/storage.js` saves data to Upstash Redis on Vercel and to JSON files on your computer.

GitHub Pages can show the shop but can't run the server, so ordering and the staff dashboard only work on Vercel (or another host that runs Node).

Prices, stock levels and specials in the inventory are sample data.
