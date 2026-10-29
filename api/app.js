// Vercel serverless function: vercel.json sends /staff/... and /api/orders/... here.
// The shop itself (public/) is served by Vercel as static files.
module.exports = require('../server/app.js').app;
