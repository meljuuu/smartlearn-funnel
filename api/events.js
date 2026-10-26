const gateway = require('../server/gateway.cjs');
const core = require('../shared/core.cjs');

function createHandler(env = process.env, fetcher = fetch) {
  return async (req, res) => {
    if (req.method !== 'POST') return gateway.json(res, 405, { ok: false });
    if (!gateway.transportConfigured(env) || env.EVENTS_ENABLED !== 'true' || (env.EVENT_INGEST_SECRET || '').length < 32) return gateway.json(res, 503, { ok: false, code: 'events_disabled' });
    if (!gateway.secureEqual(req.headers.authorization, `Bearer ${env.EVENT_INGEST_SECRET}`)) return gateway.json(res, 401, { ok: false });
    let event;
    try { event = await gateway.body(req); } catch { return gateway.json(res, 400, { ok: false }); }
    const types = ['booked', 'rescheduled', 'cancelled', 'replied', 'stopped'];
    if (!event || !types.includes(event.type) || typeof event.eventId !== 'string' || !/^[\w:.-]{1,180}$/.test(event.eventId) ||
      (event.leadId && !core.uuid.test(event.leadId)) || !core.email.test(event.email || '') ||
      !Number.isFinite(Date.parse(event.occurredAt)) || Date.parse(event.occurredAt) > Date.now() + 300000) return gateway.json(res, 422, { ok: false });
    for (const key of ['host', 'dateTime', 'timeZone', 'meetingUrl', 'rescheduleUrl', 'bookingId']) {
      if (event[key] !== undefined && (typeof event[key] !== 'string' || event[key].length > 500 || /[\x00-\x1f]/.test(event[key]))) return gateway.json(res, 422, { ok: false });
    }
    if (['booked', 'rescheduled', 'cancelled'].includes(event.type) && (!core.uuid.test(event.leadId || '') || !event.bookingId)) return gateway.json(res, 422, { ok: false });
    if (['booked', 'rescheduled'].includes(event.type) && (!event.dateTime || !event.timeZone)) return gateway.json(res, 422, { ok: false });
    event = Object.fromEntries(['type', 'eventId', 'email', 'leadId', 'occurredAt', 'host', 'dateTime', 'timeZone', 'meetingUrl', 'rescheduleUrl', 'bookingId'].filter(key => event[key] !== undefined).map(key => [key, event[key]]));
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
