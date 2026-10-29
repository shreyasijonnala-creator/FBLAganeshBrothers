#!/usr/bin/env node
// Runs the Ganesh Brothers site on your computer. (On Vercel, api/app.js runs the same code instead.)
//   STAFF_PASSWORD=choose-a-password node server/server.js
//   STAFF_PASSWORD=... node server/server.js --demo     (adds sample orders so the statistics have data)
const http = require('http');
const { app, addDemoOrders, storage } = require('./app.js');

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  if (process.argv.includes('--demo')) await addDemoOrders();
  http.createServer(app).listen(PORT, () =>
    console.log(`Ganesh Brothers running (data: ${storage.kind}):\n  Shop:  http://localhost:${PORT}/\n  Staff: http://localhost:${PORT}/staff`));
})();
