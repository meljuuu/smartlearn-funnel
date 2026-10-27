const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lead, scriptHarness } = require('./helpers.cjs');
const core = require('../shared/core.cjs');
const { createHandler } = require('../api/leads.js');
const { createHandler: eventHandler } = require('../api/events.js');

test('server validation keeps all categories, solo teams and other areas; rejects malformed and oversized data', () => {
  for (const business_type of core.choices.business_type) assert.deepEqual(core.validateLead(lead({ business_type })).errors, {});
  for (const patch of [{ email: 'bad' }, { contact_consent: 'true' }, { full_name: '   ' }, { business_name: 'x'.repeat(161) }, { business_type: 'forged' }, { website_url: 'spam' }, { phone: 'a\nb' }]) assert.ok(Object.keys(core.validateLead(lead(patch)).errors).length);
  assert.equal(core.validateLead(lead({ attribution: { utm_source: '=X', password: 'no' } })).value.attribution.password, undefined);
});
test('locked capture persists once, replay returns same ID, changed payload conflicts, status reconciles without personal data', () => {
  const h = scriptHarness(), data = lead({ business_name: '=IMPORTXML("x")' });
  const first = h.post({ action: 'capture', lead: data, clientKey: 'test' });
  assert.equal(first.ok, true);
  assert.equal(h.post({ action: 'capture', lead: data, clientKey: 'test' }).leadId, first.leadId);
  assert.equal(h.sheets.get('Leads & Discovery Calls').getLastRow(), 2);
  assert.equal(h.post({ action: 'capture', lead: { ...data, full_name: 'Changed' }, clientKey: 'test' }).code, 'conflict');
  const status = h.post({ action: 'status', lead: { request_id: data.request_id }, clientKey: 'test' });
  assert.deepEqual(Object.keys(status).sort(), ['leadId', 'ok', 'state']);
  assert.equal(status.state, 'captured');
  assert.ok(h.writes.some(w => w.values.some(row => row.includes("'=IMPORTXML(\"x\")"))));
  const rows = h.sheets.get('Leads & Discovery Calls').rows;
  assert.equal(rows[1][2], ''); // Website IDs never enter the Meta ID column.
  assert.equal(rows[1][12], 'New');
});
test('signed envelope rejects tampering, expired requests and disabled capture; limits new requests', () => {
  const h = scriptHarness(), data = { action: 'capture', lead: lead(), clientKey: 'limited' };
  assert.equal(h.post(data, v => ({ ...v, signature: '0'.repeat(64) })).code, 'auth');
  assert.equal(h.post(data, v => ({ ...v, timestamp: Date.now() - 600000 })).code, 'auth');
  for (let i = 0; i < 5; i++) assert.equal(h.post({ ...data, lead: lead() }).ok, true);
  assert.equal(h.post({ ...data, lead: lead() }).code, 'rate_limited');
  h.props.CAPTURE_ENABLED = 'false';
  assert.equal(h.post(data).code, 'capture_disabled');
});
test('legacy records and notes survive installation and capture; missing or duplicate headers fail closed', () => {
  const h = scriptHarness(), sheet = h.sheets.get('Leads & Discovery Calls');
  sheet.rows.push(['legacy', 'Meta', 'meta-123', '', '', 'old@example.invalid', '', '', '', '', '', 'Owner', 'Qualified', '', '', '', '', 'Keep this note']);
  const original = JSON.stringify(sheet.rows[1]);
  h.context.initializeSmartLearn(); h.post({ action: 'capture', lead: lead(), clientKey: 'test' });
  assert.equal(JSON.stringify(sheet.rows[1]), original);
  sheet.rows[0][0] = 'Renamed';
  assert.equal(h.post({ action: 'capture', lead: lead(), clientKey: 'test' }).ok, false);
});
function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(raw) { this.body = JSON.parse(raw); } }; }
const env = { FUNNEL_MODE: 'live', CAPTURE_ENABLED: 'true', PRIVACY_POLICY_URL: 'https://example.invalid/privacy', ALLOWED_ORIGINS: 'https://example.invalid', APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec', APPS_SCRIPT_SECRET: 'test-only-signing-secret-at-least-32-characters' };
test('Vercel handler rejects invalid origin/body/config and never reports malformed or failed upstream as captured', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return { ok: true, json: async () => ({ ok: true }) }; };
  const request = { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json' }, body: lead() };
  for (const [handler, req, status] of [
    [createHandler({}, fetcher), request, 503],
    [createHandler(env, fetcher), { ...request, method: 'OPTIONS' }, 405],
    [createHandler(env, fetcher), { ...request, headers: { ...request.headers, origin: 'https://attacker.invalid' } }, 403],
    [createHandler(env, fetcher), { ...request, body: { ...request.body, contact_consent: false } }, 422],
    [createHandler(env, fetcher), { ...request, body: '{' }, 400],
    [createHandler(env, fetcher), request, 503],
    [createHandler(env, async () => { throw new Error('timeout'); }), request, 503]
  ]) { const res = response(); await handler(req, res); assert.equal(res.statusCode, status); assert.equal(res.body.ok, false); }
  assert.equal(calls, 1);
});
test('Vercel proxy and Apps Script agree on signatures, durable contract, replay and status', async () => {
  const h = scriptHarness();
  const handler = createHandler(env, async (url, options) => ({ ok: true, json: async () => JSON.parse(h.context.doPost({ postData: { contents: options.body } }).text) }));
  const req = { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json' }, body: lead() };
  const first = response(); await handler(req, first); assert.equal(first.body.state, 'captured');
  const replay = response(); await handler(req, replay); assert.equal(replay.body.leadId, first.body.leadId);
  const status = response(); await handler({ ...req, body: { action: 'status', request_id: req.body.request_id } }, status); assert.equal(status.body.leadId, first.body.leadId);
});
test('notification failures cannot undo capture or auto-resend; repeated events and stop suppress future mail', () => {
  const h = scriptHarness(), data = lead(), captured = h.post({ action: 'capture', lead: data, clientKey: 'test' });
  Object.assign(h.props, { EMAIL_ENABLED: 'true', SENDER_EMAIL: 'authorized@example.invalid', REPLY_TO_EMAIL: 'reply@example.invalid', OWNER_NOTIFICATION_EMAILS: 'owner@example.invalid', failMail: true });
  h.context.processSmartLearnNotifications(); assert.equal(h.sent.length, 2);
  assert.ok(h.sheets.get('_SmartLearnDelivery').rows.slice(1).every(r => r[1] === 'uncertain'));
  h.props.failMail = false; h.context.processSmartLearnNotifications(); assert.equal(h.sent.length, 2);
  const event = { type: 'stopped', eventId: 'stop:1', email: data.email, occurredAt: new Date().toISOString() };
  assert.equal(h.post({ action: 'event', event }).ok, true);
  assert.equal(h.post({ action: 'event', event }).ok, true);
  assert.equal(h.sheets.get('_SmartLearnEvents').getLastRow(), 2);
  h.post({ action: 'capture', lead: lead({ email: data.email }), clientKey: 'other' });
  h.context.processSmartLearnNotifications();
  assert.equal(h.sent.filter(args => args[0] === data.email).length, 1);
  assert.equal(h.post({ action: 'status', lead: { request_id: data.request_id }, clientKey: 'test' }).leadId, captured.leadId);
});
test('verified event adapter requires authorization and matching identity; reschedules and cancellations ignore stale events', async () => {
  const h = scriptHarness(), data = lead(), captured = h.post({ action: 'capture', lead: data, clientKey: 'test' });
  const base = { email: data.email, leadId: captured.leadId, bookingId: 'real-provider-event', dateTime: '2026-10-30T10:00:00-07:00', timeZone: 'America/Vancouver' };
  const booked = { ...base, type: 'booked', eventId: 'booking:1', occurredAt: '2026-10-26T01:00:00Z' };
  assert.equal(h.post({ action: 'event', event: { ...booked, email: 'wrong@example.invalid' } }).code, 'lead_mismatch');
  h.post({ action: 'event', event: booked });
  h.post({ action: 'event', event: { ...base, type: 'rescheduled', eventId: 'booking:2', occurredAt: '2026-10-26T02:00:00Z' } });
  h.post({ action: 'event', event: { ...base, type: 'cancelled', eventId: 'booking:3', occurredAt: '2026-10-26T03:00:00Z' } });
  h.post({ action: 'event', event: { ...booked, eventId: 'stale:1' } });
  const state = JSON.parse(h.sheets.get('_SmartLearnState').rows[1][1]);
  assert.equal(state.booked, false); assert.equal(state.cancelled, true);
  const res = response();
  await eventHandler({ ...env, EVENTS_ENABLED: 'true', EVENT_INGEST_SECRET: 'test-event-secret-at-least-32-characters' })({ method: 'POST', headers: {}, body: booked }, res);
  assert.equal(res.statusCode, 401);
});
test('campaign merge fields render, missing calendar details block confirmation, business days and stop gates work', () => {
  const data = lead();
  assert.ok(!/\[[^\]]+\]/.test(core.message('ack', data, {}).body));
  assert.throws(() => core.message('confirmation', data, {}, {}));
  assert.equal(core.businessDaysElapsed('2026-10-23T12:00:00Z', '2026-10-26T12:00:00Z', 'America/Vancouver'), 1);
  for (const state of [{ stopped: true }, { replied: true }, { booked: true }, { cancelled: true }, { manualHold: true }]) assert.equal(core.promptsAllowed(state), false);
});
