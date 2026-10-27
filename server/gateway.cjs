const { createHmac, timingSafeEqual } = require('node:crypto');
const core = require('../shared/core.cjs');

function json(res, code, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = code;
  res.end(JSON.stringify(data));
}
function transportConfigured(env) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.APPS_SCRIPT_URL || '') &&
    (env.APPS_SCRIPT_SECRET || '').length >= 32 && Boolean(env.ALLOWED_ORIGINS);
}
function configured(env) { return env.CAPTURE_ENABLED === 'true' && core.https(env.PRIVACY_POLICY_URL) && transportConfigured(env); }
function originAllowed(req, env) {
  // No wildcard previews. Add each approved preview origin to the server setting.
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim());
  return typeof req.headers.origin === 'string' && allowed.includes(req.headers.origin);
}
async function body(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new Error('content_type');
  if (Number(req.headers['content-length']) > 16384) throw new Error('too_large');
  if (req.body !== undefined) {
    const value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(value)) > 16384) throw new Error('too_large');
    return value;
  }
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 16384) throw new Error('too_large'); }
  return JSON.parse(raw);
}
async function bridge(action, payload, env, fetcher = fetch) {
  const timestamp = Date.now();
  const data = JSON.stringify({ action, ...payload });
  const signature = createHmac('sha256', env.APPS_SCRIPT_SECRET).update(`${timestamp}.${data}`).digest('hex');
  const response = await fetcher(env.APPS_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp, data, signature }), signal: AbortSignal.timeout(22000), redirect: 'follow'
  });
  if (!response.ok) throw new Error('gateway');
  const result = await response.json();
  if (!result || typeof result.ok !== 'boolean') throw new Error('gateway');
  return result;
}
function secureEqual(a, b) {
  return typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
module.exports = { json, configured, transportConfigured, originAllowed, body, bridge, secureEqual };
