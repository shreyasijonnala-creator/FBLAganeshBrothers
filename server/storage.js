// Where the server keeps its data (orders, the session key, and a note of whether demo orders were added).
//  - Upstash Redis when its settings are present (Vercel → Storage → Upstash adds them automatically).
//  - Otherwise JSON files: in server/ on your computer, or /tmp on Vercel (temporary — may reset).
const fs = require('fs');
const path = require('path');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEYS = ['orders', 'staff', 'secret'];

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error('Database error: ' + (data.error || r.status));
  return data.result;
}

const DIR = process.env.VERCEL ? '/tmp' : __dirname;
const FILES = {
  orders: process.env.ORDERS_FILE || path.join(DIR, 'orders.json'),
  staff: process.env.STAFF_FILE || path.join(DIR, 'staff.json'),
  secret: path.join(DIR, 'secret.json'),
};

module.exports = {
  kind: REDIS_URL && REDIS_TOKEN ? 'redis' : process.env.VERCEL ? 'temporary' : 'files',

  // Returns { orders, staff, secret } (each null if nothing is saved yet).
  async loadAll() {
    if (this.kind === 'redis') {
      const values = await redis(['MGET', ...KEYS.map(k => 'gb:' + k)]);
      return Object.fromEntries(KEYS.map((k, i) => [k, values[i] ? JSON.parse(values[i]) : null]));
    }
    return Object.fromEntries(KEYS.map(k => {
      try { return [k, JSON.parse(fs.readFileSync(FILES[k], 'utf8'))]; } catch { return [k, null]; }
    }));
  },

  async save(key, value) {
    const json = JSON.stringify(value);
    if (this.kind === 'redis') return redis(['SET', 'gb:' + key, json]);
    fs.writeFileSync(FILES[key] + '.tmp', json);
    fs.renameSync(FILES[key] + '.tmp', FILES[key]);
  },
};
