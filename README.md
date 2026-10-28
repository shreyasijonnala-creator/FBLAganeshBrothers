# Ganesh Brothers

Website for Ganesh Brothers, an Indian grocery in Ellicott City, MD.

- **Customers** browse the store, build a shopping list, plan recipes, and send the list as a **pickup order**. The page shows the order's status live and alerts them when it's ready.
- **Staff** sign in at `/staff` to see incoming orders (New → Preparing → Ready → Picked up) and **statistics**: most-ordered products, busiest aisles, hours and days, items often bought together, revenue and prep time.

## Run it

Needs [Node.js](https://nodejs.org) 18 or newer. No packages to install.

```sh
STAFF_PASSWORD=choose-a-password npm start      # shop: http://localhost:3000   staff: http://localhost:3000/staff
STAFF_PASSWORD=choose-a-password npm run demo   # same, plus 90 sample orders so the statistics have data
```

`STAFF_PASSWORD` sets the **first** staff password. After that, staff can view and change the password on the dashboard's **Settings** tab. A change applies to every staff member right away, signs everyone else out, and survives restarts (it's saved in `server/staff.json`, which isn't committed). To reset a forgotten password, delete `server/staff.json` and restart with a new `STAFF_PASSWORD`. If no password is set at all, the server prints one when it starts.

## Folders

| Path | What it is |
|---|---|
| `public/` | The customer site. Everything here is public. |
| `public/data/inventory.js` | Every product: brand, name, price, stock, specials. Edit this to change the catalog. |
| `server/server.js` | The server: serves `public/`, takes orders, runs the staff dashboard. |
| `server/staff.html`, `server/login.html` | Staff pages. Served only through `/staff` after signing in — never as public files. |
| `server/orders.json` | Saved orders (created automatically, not committed). |
| `server/staff.json` | The current staff password (created automatically, not committed). |
| `tools/make-art.js` | Draws the product pictures in `public/images/`. Run `npm run art` after editing the inventory. |

## Hosting

GitHub Pages can show the shop but can't run the server, so ordering won't work there. To go live, host on a service that runs Node (for example Render or Railway): start command `npm start`, and set `STAFF_PASSWORD` and `SESSION_SECRET` as environment variables. Use persistent storage for `server/orders.json` (or point `ORDERS_FILE` at a mounted disk) so orders survive restarts.

Prices, stock levels and specials in the inventory are sample data.
