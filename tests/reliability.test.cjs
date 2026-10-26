const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { scriptHarness, lead } = require('./helpers.cjs');
const { verifyAdapter } = require('../server/verify-google.cjs');
const { createHandler } = require('../api/leads.js');
function mail(h) { Object.assign(h.props, { EMAIL_ENABLED: 'true', SENDER_EMAIL: 'authorized@example.invalid', REPLY_TO_EMAIL: 'reply@example.invalid', OWNER_NOTIFICATION_EMAILS: 'owner@example.invalid', BOOKING_CONFIRMATION_SYSTEM: 'adapter' }); }
function booking(h, leadId, overrides = {}) { return { type: 'booked', eventId: 'provider:one', leadId, email: 'test@example.invalid', occurredAt: '2026-10-26T01:00:00Z', bookingId: 'provider-booking', dateTime: '2026-10-30T10:00:00-07:00', timeZone: 'America/Vancouver', host: 'Test Host', meetingUrl: 'https://example.invalid/meeting', rescheduleUrl: 'https://example.invalid/reschedule', ...overrides }; }
test('native tracker receives real Date and numeric headcount, never range labels; writes grow the grid safely', () => {
  const h = scriptHarness(), sheet = h.sheets.get('Leads & Discovery Calls'); sheet.maxRows = 1;
  const result = h.post({ action: 'capture', lead: lead({ team_size: '25' }), clientKey: 'test' });
  assert.equal(result.ok, true); assert.ok(sheet.rows[1][0] instanceof Date); assert.equal(sheet.rows[1][9], 25); assert.ok(sheet.maxRows > 1);
  assert.equal(h.post({ action: 'capture', lead: lead({ team_size: '2–5' }), clientKey: 'test' }).code, 'validation');
  assert.equal(h.post({ action: 'capture', lead: lead({ request_id: [lead().request_id] }), clientKey: 'test' }).code, 'validation');
});
test('calendar retry repairs the typed tracker cell after state was durably saved and cell write failed', () => {
  const h = scriptHarness(), result = h.post({ action: 'capture', lead: lead(), clientKey: 'test' });
  const sheet = h.sheets.get('Leads & Discovery Calls'), original = sheet.getRange.bind(sheet); let fail = true;
  sheet.getRange = (...args) => { const range = original(...args); if (args[0] === 2 && args[1] === 15) { const set = range.setValue; range.setValue = value => { if (fail) { fail = false; throw new Error('simulated cell write failure'); } return set(value); }; } return range; };
  const event = booking(h, result.leadId);
  assert.equal(h.post({ action: 'event', event }).ok, false);
  assert.equal(h.sheets.get('_SmartLearnEvents').getLastRow(), 1);
  assert.equal(h.post({ action: 'event', event }).ok, true);
  assert.ok(sheet.rows[1][14] instanceof Date); assert.equal(sheet.rows[1][14].toISOString(), '2026-10-30T17:00:00.000Z');
});
test('equivalent booking deliveries with different transport event IDs send one confirmation', () => {
  const h = scriptHarness(), result = h.post({ action: 'capture', lead: lead(), clientKey: 'test' }); mail(h);
  h.post({ action: 'event', event: booking(h, result.leadId) }); h.context.processSmartLearnNotifications();
  h.post({ action: 'event', event: booking(h, result.leadId, { eventId: 'provider:two', occurredAt: '2026-10-26T02:00:00Z' }) }); h.context.processSmartLearnNotifications();
  assert.equal(h.sent.filter(args => args[0] === 'test@example.invalid').length, 1);
});
test('incomplete confirmation is observable, does not block other leads, and can recover before a send attempt', () => {
  const h = scriptHarness(), first = h.post({ action: 'capture', lead: lead(), clientKey: 'test' }); mail(h);
  const incomplete = booking(h, first.leadId); delete incomplete.meetingUrl;
  h.post({ action: 'event', event: incomplete });
  h.post({ action: 'capture', lead: lead({ email: 'second@example.invalid' }), clientKey: 'test' });
  h.context.processSmartLearnNotifications();
  const health = h.post({ action: 'health' });
  assert.equal(health.delivery.blocked_configuration, 1);
  assert.equal(h.sent.filter(args => args[0] === 'second@example.invalid').length, 1);
  assert.equal(h.sent.filter(args => args[0] === 'test@example.invalid').length, 0);
  h.post({ action: 'event', event: booking(h, first.leadId, { eventId: 'provider:corrected', occurredAt: '2026-10-26T03:00:00Z' }) });
  h.context.processSmartLearnNotifications(); assert.equal(h.sent.filter(args => args[0] === 'test@example.invalid').length, 1);
});
test('synthetic capture check reconciles a lost response, survives fresh handler instances and never queues email', async () => {
  const h = scriptHarness(); h.props.TEST_CAPTURE_ENABLED = 'true'; h.props.CAPTURE_ENABLED = 'false';
  let loseResponse = true;
  const send = async (action, payload) => { const result = h.post({ action, ...payload }); if (action === 'test_capture' && loseResponse) { loseResponse = false; throw new Error('lost response'); } return result; };
  const result = await verifyAdapter(send, true);
  assert.equal(result.captured, true); assert.equal(result.replayMatched, true); assert.equal(h.props.TEST_CAPTURE_ENABLED, 'false');
  const sheet = h.sheets.get('Leads & Discovery Calls'); assert.equal(sheet.getLastRow(), 2); assert.equal(sheet.rows[1][1], 'Integration test (synthetic)');
  mail(h); h.context.processSmartLearnNotifications(); assert.equal(h.sent.length, 0);
  const settings = { FUNNEL_MODE: 'preview', CAPTURE_ENABLED: 'true', PRIVACY_POLICY_URL: 'https://example.invalid/privacy', ALLOWED_ORIGINS: 'https://example.invalid', APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec', APPS_SCRIPT_SECRET: h.props.APPS_SCRIPT_SECRET };
  const res = { setHeader() {}, end(raw) { this.body = JSON.parse(raw); } };
  await createHandler(settings)({ method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json' }, body: lead() }, res);
  assert.equal(res.body.code, 'capture_disabled'); // Preview also blocks direct public API attempts.
});
test('duplicate tracker IDs and malformed authenticated event payloads fail safely', () => {
  const h = scriptHarness(), data = lead(); h.post({ action: 'capture', lead: data, clientKey: 'test' });
  const sheet = h.sheets.get('Leads & Discovery Calls'); sheet.rows.push(sheet.rows[1].slice());
  assert.equal(h.post({ action: 'status', lead: { request_id: data.request_id }, clientKey: 'test' }).ok, false);
  const core = require('../shared/core.cjs');
  for (const patch of [{ email: ['test@example.invalid'] }, { occurredAt: 'yesterday' }, { dateTime: 'October 30 at 10' }, { meetingUrl: 'javascript:alert(1)' }]) assert.ok(Object.keys(core.validateEvent({ ...booking(h, lead().request_id), ...patch }).errors).length);
});
test('capture-only installation has no Gmail capability and retains signed health/synthetic-test controls', () => {
  const capture = fs.readFileSync('apps-script/SmartLearn.gs', 'utf8').split('function slMailConfig()')[0];
  assert.ok(!capture.includes('GmailApp')); assert.ok(capture.includes('TEST_CAPTURE_ENABLED'));
  assert.ok(capture.includes('inspectSmartLearnSetup'));
  assert.deepEqual(JSON.parse(fs.readFileSync('apps-script/appsscript.capture.json')).oauthScopes, ['https://www.googleapis.com/auth/spreadsheets']);
});
test('manual reply/stop controls suppress future requests without changing the native Status dropdown', () => {
  const h = scriptHarness(), data = lead(); h.post({ action: 'capture', lead: data, clientKey: 'test' });
  h.context.slRecordContact('replied', data.email); h.context.slRecordContact('stopped', data.email);
  h.post({ action: 'capture', lead: lead({ email: data.email }), clientKey: 'test' }); mail(h); h.context.processSmartLearnNotifications();
  assert.equal(h.sent.filter(args => args[0] === data.email).length, 0);
  assert.equal(h.sheets.get('Leads & Discovery Calls').rows[1][12], 'New');
  assert.equal(JSON.parse(h.sheets.get('_SmartLearnContacts').rows[1][1]).stopped, true);
});
test('manual Booked status holds acknowledgment and followups without inventing a calendar event', () => {
  const h = scriptHarness(); h.post({ action: 'capture', lead: lead(), clientKey: 'test' });
  h.sheets.get('Leads & Discovery Calls').rows[1][12] = 'Booked'; mail(h); h.context.processSmartLearnNotifications();
  assert.equal(h.sent.filter(args => args[0] === 'test@example.invalid').length, 0);
  assert.equal(h.sheets.get('_SmartLearnState').getLastRow(), 1);
});
test('fresh server handlers and restarted adapter code reconcile concurrently against the same durable mock Sheet', async () => {
  const h = scriptHarness(), data = lead();
  const settings = { FUNNEL_MODE: 'live', CAPTURE_ENABLED: 'true', PRIVACY_POLICY_URL: 'https://example.invalid/privacy', ALLOWED_ORIGINS: 'https://example.invalid', APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec', APPS_SCRIPT_SECRET: h.props.APPS_SCRIPT_SECRET };
  const fetcher = async (url, options) => ({ ok: true, json: async () => JSON.parse(h.context.doPost({ postData: { contents: options.body } }).text) });
  const submit = async () => { const res = { setHeader() {}, end(text) { this.body = JSON.parse(text); } }; await createHandler(settings, fetcher)({ method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json' }, body: data }, res); return res.body; };
  const first = await submit(); h.restart();
  const concurrent = await Promise.all(Array.from({ length: 5 }, submit));
  assert.ok(concurrent.every(result => result.ok && result.leadId === first.leadId));
  assert.equal(h.sheets.get('Leads & Discovery Calls').getLastRow(), 2);
});
