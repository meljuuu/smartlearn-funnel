const { createHmac } = require('node:crypto');
const core = require('../shared/core.cjs');
const gateway = require('../server/gateway.cjs');

function createHandler(env = process.env, fetcher = fetch) {
  return async (req, res) => {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return gateway.json(res, 405, { ok: false, code: 'method' }); }
    if (!gateway.transportConfigured(env)) return gateway.json(res, 503, { ok: false, code: 'capture_disabled' });
    if (!gateway.originAllowed(req, env)) return gateway.json(res, 403, { ok: false, code: 'origin' });
    let data;
    try { data = await gateway.body(req); } catch { return gateway.json(res, 400, { ok: false, code: 'invalid_body' }); }
    if (data?.action !== undefined && !['capture', 'status'].includes(data.action)) return gateway.json(res, 400, { ok: false, code: 'validation' });
    const action = data?.action === 'status' ? 'status' : 'capture';
    if (action === 'capture' && (env.FUNNEL_MODE !== 'live' || !gateway.configured(env))) return gateway.json(res, 503, { ok: false, code: 'capture_disabled' });
    if (action === 'status' && (typeof data.request_id !== 'string' || !core.uuid.test(data.request_id))) return gateway.json(res, 400, { ok: false, code: 'validation' });
    const checked = action === 'capture' ? core.validateLead(data) : { value: { request_id: data.request_id.toLowerCase() }, errors: {} };
    if (Object.keys(checked.errors).length) return gateway.json(res, 422, { ok: false, code: 'validation', errors: checked.errors });
    // Vercel supplies x-real-ip. Never store raw IPs or trust a client payload's IP.
    const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const clientKey = createHmac('sha256', env.APPS_SCRIPT_SECRET).update(String(ip)).digest('hex');
    try {
      const result = await gateway.bridge(action, { lead: checked.value, clientKey }, env, fetcher);
      if (!result.ok) return gateway.json(res, result.code === 'rate_limited' ? 429 : result.code === 'conflict' ? 409 : 503, { ok: false, code: result.code || 'unavailable' });
      if (action === 'status' && result.state === 'not_found') return gateway.json(res, 200, { ok: true, state: 'not_found' });
      if (!core.uuid.test(result.leadId || '')) throw new Error('unconfirmed');
      return gateway.json(res, 200, { ok: true, leadId: result.leadId, state: 'captured' });
    } catch { return gateway.json(res, 503, { ok: false, code: 'unconfirmed' }); }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
