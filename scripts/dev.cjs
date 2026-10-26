// Local static/API harness. No secrets are loaded implicitly; default capture is disabled.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const leads = require('../api/leads.js'), events = require('../api/events.js');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
const root = path.resolve('public');
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/leads') return leads(req, res);
  if (pathname === '/api/events') return events(req, res);
  const file = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store'); fs.createReadStream(file).pipe(res);
}).listen(4173, '127.0.0.1', () => console.log('Review server: http://127.0.0.1:4173'));
