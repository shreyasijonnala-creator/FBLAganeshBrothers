#!/usr/bin/env node
// Ganesh Brothers server.
//  - Serves the customer site from public/.
//  - Takes pickup orders (POST /api/orders) and lets each customer check only their own order.
//  - Hosts the password-protected staff dashboard at /staff. Its files live in server/ and are
//    never served as static files, so customers can't open them.
// No packages needed. Run:
//   STAFF_PASSWORD=choose-a-password node server/server.js
//   STAFF_PASSWORD=... node server/server.js --demo     (adds sample orders so the statistics have data)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { INVENTORY_ITEMS, INVENTORY_CATEGORIES } = require('../public/data/inventory.js');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');
const DB = process.env.ORDERS_FILE || path.join(__dirname, 'orders.json');
const TZ = 'America/New_York';
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
let PASSWORD = process.env.STAFF_PASSWORD;
if (!PASSWORD) {
  PASSWORD = crypto.randomBytes(6).toString('base64url');
  console.log(`\nNo STAFF_PASSWORD set. Staff password for this run: ${PASSWORD}\n`);
}

const byId = Object.fromEntries(INVENTORY_ITEMS.map(p => [p.id, p]));
const catName = Object.fromEntries(INVENTORY_CATEGORIES.map(c => [c.id, c.name]));
const displayName = p => (p.brand && !p.name.startsWith(p.brand) ? p.brand + ' ' : '') + p.name;
const round2 = n => Math.round(n * 100) / 100;

/* ---------- storage (a JSON file, written atomically) ---------- */
let orders = [];
try { orders = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { orders = []; }
function persist() {
  const tmp = DB + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(orders));
  fs.renameSync(tmp, DB);
}

/* ---------- small helpers ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json' };
function send(res, code, body, type = 'application/json; charset=utf-8', headers = {}) {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...headers });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readJson(req, limit = 50000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('Request too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

// Simple per-IP rate limit: at most `max` hits per `windowMs`.
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(), list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now); hits.set(key, list);
  return list.length > max;
}

/* ---------- staff sessions (signed, HttpOnly cookie) ---------- */
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p.length === 2));
}
function isStaff(req) {
  const t = cookies(req).gb_staff; if (!t) return false;
  const [exp, sig] = t.split('.');
  return !!exp && !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}
function sessionCookie(req) {
  const exp = String(Date.now() + 12 * 3600e3);
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return `gb_staff=${exp}.${sign(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`;
}

/* ---------- orders ---------- */
const STATUS_FLOW = { received: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['picked-up', 'cancelled'], 'picked-up': [], cancelled: [] };
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  do { id = 'GB-' + Array.from(crypto.randomBytes(4), b => A[b % A.length]).join(''); } while (orders.some(o => o.id === id));
  return id;
}
function buildOrder(body) {
  const name = String(body.name || '').trim().slice(0, 60);
  const phone = String(body.phone || '').trim().slice(0, 25);
  if (!name) throw new Error('Please enter your name.');
  if (!/^[0-9+()\-.\s]{7,25}$/.test(phone)) throw new Error('Please enter a valid phone number.');
  const items = [];
  for (const it of (Array.isArray(body.items) ? body.items : []).slice(0, 150)) {
    const qty = Math.min(99, Math.max(1, parseInt(it.qty, 10) || 1));
    if (it.pid) {
      const p = byId[it.pid]; if (!p) continue;
      // Prices always come from the server's inventory, never from the browser.
      items.push({ pid: p.id, name: displayName(p), cat: p.cat, qty, price: p.price, soldOut: p.stock === 'out' });
    } else {
      const n = String(it.name || '').trim().slice(0, 80);
      if (n) items.push({ pid: null, name: n, cat: 'other', qty, price: 0 });
    }
  }
  if (!items.length) throw new Error('Your list is empty.');
  const now = Date.now();
  return {
    id: newCode(), token: crypto.randomBytes(16).toString('hex'), name, phone,
    pickup: String(body.pickup || 'As soon as possible').slice(0, 40), notes: String(body.notes || '').trim().slice(0, 300),
    items, total: round2(items.reduce((s, i) => s + i.price * i.qty, 0)), status: 'received', createdAt: now, updatedAt: now,
    history: [{ status: 'received', at: now }],
  };
}
// What a customer may see about their own order.
const publicView = o => ({ id: o.id, status: o.status, pickup: o.pickup, total: o.total, createdAt: o.createdAt, updatedAt: o.updatedAt,
  items: o.items.map(i => ({ pid: i.pid, name: i.name, qty: i.qty, price: i.price })), history: o.history.map(h => ({ status: h.status, at: h.at })) });
const staffView = o => { const { token, ...rest } = o; return rest; };

/* ---------- statistics ---------- */
const hourFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ });
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
function stats(days) {
  const from = days ? Date.now() - days * 864e5 : 0;
  const inRange = orders.filter(o => o.createdAt >= from);
  const done = inRange.filter(o => o.status !== 'cancelled');
  const today = dateFmt.format(Date.now());
  const prod = {}, cats = {}, pairs = {}, phones = {};
  const byHour = Array(24).fill(0), byDay = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  for (const o of done) {
    byHour[Number(hourFmt.format(o.createdAt))]++;
    byDay[dayFmt.format(o.createdAt)]++;
    phones[o.phone.replace(/\D/g, '')] = (phones[o.phone.replace(/\D/g, '')] || 0) + 1;
    const ids = new Set();
    for (const i of o.items) {
      if (!i.pid) continue;
      ids.add(i.pid);
      const p = prod[i.pid] || (prod[i.pid] = { id: i.pid, name: i.name, units: 0, orders: 0, revenue: 0 });
      p.units += i.qty; p.orders++; p.revenue += i.qty * i.price;
      cats[i.cat] = (cats[i.cat] || 0) + i.qty;
    }
    const list = [...ids].sort();
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) { const k = list[a] + '|' + list[b]; pairs[k] = (pairs[k] || 0) + 1; }
  }
  const prep = done.map(o => (o.history.find(h => h.status === 'ready') || {}).at - o.createdAt).filter(m => m > 0);
  const revenue = round2(done.reduce((s, o) => s + o.total, 0));
  const customers = Object.keys(phones).length;
  return {
    range: days || 'all',
    kpis: {
      orders: done.length, cancelled: inRange.length - done.length, revenue,
      avgOrder: done.length ? round2(revenue / done.length) : 0,
      avgPrepMinutes: prep.length ? Math.round(prep.reduce((s, m) => s + m, 0) / prep.length / 60000) : null,
      ordersToday: orders.filter(o => o.status !== 'cancelled' && dateFmt.format(o.createdAt) === today).length,
      customers, returningCustomers: Object.values(phones).filter(n => n > 1).length,
      openOrders: orders.filter(o => ['received', 'preparing', 'ready'].includes(o.status)).length,
      demoOrders: orders.filter(o => o.demo).length,
    },
    topProducts: Object.values(prod).sort((a, b) => b.units - a.units || b.orders - a.orders).slice(0, 10).map(p => ({ ...p, revenue: round2(p.revenue) })),
    topCategories: Object.entries(cats).map(([id, units]) => ({ id, name: catName[id] || id, units })).sort((a, b) => b.units - a.units).slice(0, 8),
    byHour, byDay,
    boughtTogether: Object.entries(pairs).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, n]) => ({ items: k.split('|').map(id => byId[id] ? displayName(byId[id]) : id), orders: n })),
  };
}

/* ---------- demo data (only with --demo) ---------- */
function seedDemo() {
  const popular = ['basmati-rice', 'toor-dal', 'red-onion', 'tomato', 'plain-yogurt-dahi', 'whole-milk', 'ginger-root', 'green-chili-pepper', 'laxmi-turmeric-powder',
    'deep-cumin-seeds', 'suhana-garam-masala', 'minute-khana-punjabi-samosa', 'anand-madras-murukku', 'parle-parle-g-biscuits', 'tata-tea-gold', 'paneer-block',
    'ghee-clarified-butter', 'masoor-dal-red-split', 'vadilal-green-peas', 'lemon', 'banana', 'mango', 'potato', 'chana-dal', 'whole-wheat-atta', 'deep-kerala-mixture'];
  const all = INVENTORY_ITEMS.filter(p => p.stock !== 'out').map(p => p.id);
  const names = ['Priya S.', 'Rahul M.', 'Anjali K.', 'Vikram P.', 'Meera R.', 'Arjun D.', 'Kavya N.', 'Sanjay T.', 'Divya G.', 'Rohan B.', 'Neha J.', 'Amit V.', 'Lakshmi I.', 'Karthik R.'];
  const rnd = n => Math.floor(Math.random() * n);
  for (let i = 0; i < 90; i++) {
    const day = new Date(Date.now() - rnd(30) * 864e5);
    day.setHours(9 + rnd(12), rnd(60), 0, 0); // during store hours
    const created = day.getTime(); if (created > Date.now()) { i--; continue; }
    const picks = new Map();
    const n = 3 + rnd(8);
    for (let k = 0; k < n; k++) { const id = Math.random() < .7 ? popular[rnd(popular.length)] : all[rnd(all.length)]; picks.set(id, (picks.get(id) || 0) + 1 + (Math.random() < .2 ? 1 : 0)); }
    const who = names[rnd(names.length)];
    const o = buildOrder({ name: who, phone: '410-555-01' + String(names.indexOf(who)).padStart(2, '0'), items: [...picks].map(([pid, qty]) => ({ pid, qty })) });
    o.demo = true; o.createdAt = created;
    const prep = (10 + rnd(30)) * 60000, cancelled = Math.random() < .05;
    o.history = [{ status: 'received', at: created }];
    if (cancelled) o.history.push({ status: 'cancelled', at: created + 5 * 60000 });
    else o.history.push({ status: 'preparing', at: created + 3 * 60000 }, { status: 'ready', at: created + prep }, { status: 'picked-up', at: created + prep + 20 * 60000 });
    o.status = o.history[o.history.length - 1].status; o.updatedAt = o.history[o.history.length - 1].at;
    orders.push(o);
  }
  orders.sort((a, b) => a.createdAt - b.createdAt);
  persist();
  console.log('Added 90 demo orders.');
}
if (process.argv.includes('--demo') && !orders.some(o => o.demo)) seedDemo();

/* ---------- routes ---------- */
async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  // Customer API
  if (p === '/api/orders' && req.method === 'POST') {
    if (limited('order:' + clientIp(req), 5, 10 * 60e3)) return send(res, 429, { error: 'Too many orders from this device. Please call the store.' });
    try {
      const order = buildOrder(await readJson(req));
      orders.push(order); persist();
      console.log(`New order ${order.id} from ${order.name} (${order.items.length} items)`);
      return send(res, 201, { id: order.id, token: order.token, order: publicView(order) });
    } catch (e) { return send(res, 400, { error: e.message }); }
  }
  let m = p.match(/^\/api\/orders\/(GB-[A-Z0-9]{4})(\/cancel)?$/);
  if (m) {
    const o = orders.find(x => x.id === m[1]);
    if (!o || !safeEqual(url.searchParams.get('token') || '', o.token)) return send(res, 404, { error: 'Order not found.' });
    if (!m[2] && req.method === 'GET') return send(res, 200, publicView(o));
    if (m[2] && req.method === 'POST') {
      if (o.status !== 'received') return send(res, 409, { error: 'This order is already being prepared. Please call the store to change it.' });
      o.status = 'cancelled'; o.updatedAt = Date.now(); o.history.push({ status: 'cancelled', at: o.updatedAt, by: 'customer' }); persist();
      return send(res, 200, publicView(o));
    }
  }

  // Staff pages and API
  const page = f => fs.readFileSync(path.join(__dirname, f));
  const staffHeaders = { 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' };
  if (p === '/staff' || p === '/staff/') return send(res, 200, page(isStaff(req) ? 'staff.html' : 'login.html'), MIME['.html'], staffHeaders);
  if (p === '/staff/login' && req.method === 'POST') {
    if (limited('login:' + clientIp(req), 10, 15 * 60e3)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    let body = {}; try { body = await readJson(req, 2000); } catch {}
    if (!safeEqual(body.password || '', PASSWORD)) return send(res, 401, { error: 'Wrong password.' });
    return send(res, 200, { ok: true }, undefined, { 'Set-Cookie': sessionCookie(req) });
  }
  if (p === '/staff/logout' && req.method === 'POST') return send(res, 200, { ok: true }, undefined, { 'Set-Cookie': 'gb_staff=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  if (p.startsWith('/staff/')) {
    if (!isStaff(req)) return send(res, 401, { error: 'Please sign in.' });
    if (p === '/staff/api/orders' && req.method === 'GET') {
      const recent = Date.now() - 2 * 864e5;
      return send(res, 200, orders.filter(o => ['received', 'preparing', 'ready'].includes(o.status) || o.updatedAt > recent)
        .sort((a, b) => b.createdAt - a.createdAt).slice(0, 300).map(staffView));
    }
    m = p.match(/^\/staff\/api\/orders\/(GB-[A-Z0-9]{4})\/status$/);
    if (m && req.method === 'POST') {
      const o = orders.find(x => x.id === m[1]); if (!o) return send(res, 404, { error: 'Order not found.' });
      let body = {}; try { body = await readJson(req, 2000); } catch {}
      if (!STATUS_FLOW[o.status].includes(body.status)) return send(res, 409, { error: `Can't change a ${o.status} order to ${body.status}.` });
      o.status = body.status; o.updatedAt = Date.now(); o.history.push({ status: body.status, at: o.updatedAt }); persist();
      return send(res, 200, staffView(o));
    }
    if (p === '/staff/api/stats' && req.method === 'GET') return send(res, 200, stats(Number(url.searchParams.get('days')) || 0));
    if (p === '/staff/api/demo/clear' && req.method === 'POST') { orders = orders.filter(o => !o.demo); persist(); return send(res, 200, { ok: true }); }
    return send(res, 404, { error: 'Not found' });
  }

  // Customer site (static files from public/ only)
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
  let file;
  try { file = path.normalize(path.join(PUBLIC, decodeURIComponent(p))); } catch { return send(res, 400, 'Bad request', 'text/plain'); }
  if (file !== PUBLIC && !file.startsWith(PUBLIC + path.sep)) return send(res, 404, 'Not found', 'text/plain');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
  return send(res, 200, fs.readFileSync(file), MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', { 'Cache-Control': 'no-cache' });
}

http.createServer((req, res) => handle(req, res).catch(err => { console.error(err); send(res, 500, { error: 'Server error' }); }))
  .listen(PORT, () => console.log(`Ganesh Brothers running:\n  Shop:  http://localhost:${PORT}/\n  Staff: http://localhost:${PORT}/staff`));
