const gateway = require('../server/gateway.cjs');
const core = require('../shared/core.cjs');

function createHandler(env = process.env, fetcher = fetch) {
  return async (req, res) => {
    if (req.method !== 'POST') return gateway.json(res, 405, { ok: false });
    if (!gateway.transportConfigured(env) || env.EVENTS_ENABLED !== 'true' || (env.EVENT_INGEST_SECRET || '').length < 32) return gateway.json(res, 503, { ok: false, code: 'events_disabled' });
    if (!gateway.secureEqual(req.headers.authorization, `Bearer ${env.EVENT_INGEST_SECRET}`)) return gateway.json(res, 401, { ok: false });
    let event;
    try { event = await gateway.body(req); } catch { return gateway.json(res, 400, { ok: false }); }
    const checked = core.validateEvent(event);
    if (Object.keys(checked.errors).length) return gateway.json(res, 422, { ok: false, code: 'validation' });
    event = checked.value;
    // This is an adapter boundary, not a public calendar webhook: the authorized
    // workflow must verify provider signatures and look up the actual event first.
    try {
      const result = await gateway.bridge('event', { event }, env, fetcher);
      return gateway.json(res, result.ok ? 200 : 503, { ok: result.ok, ...(result.ok ? {} : { code: 'event_unconfirmed' }) });
    } catch { return gateway.json(res, 503, { ok: false, code: 'event_unconfirmed' }); }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
