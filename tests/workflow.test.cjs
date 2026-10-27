const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lead, scriptHarness } = require('./helpers.cjs');
function mail(h) { Object.assign(h.props, { EMAIL_ENABLED: 'true', SENDER_EMAIL: 'authorized@example.invalid', REPLY_TO_EMAIL: 'reply@example.invalid', OWNER_NOTIFICATION_EMAILS: 'owner@example.invalid', BOOKING_URL: 'https://example.invalid/calendar', FOLLOWUP_TIME_ZONE: 'America/Vancouver' }); }
test('capture while lock is held returns busy and a subsequent replay persists only once', () => {
  const h = scriptHarness(), data = lead();
  h.lock.waitLock(); assert.equal(h.post({ action: 'capture', lead: data, clientKey: 'test' }).code, 'busy');
  assert.equal(h.lock.hasLock(), true); // A busy execution cannot release another owner's lock.
  h.lock.releaseLock();
  assert.equal(h.post({ action: 'capture', lead: data, clientKey: 'test' }).ok, true);
  assert.equal(h.post({ action: 'capture', lead: data, clientKey: 'test' }).ok, true);
  assert.equal(h.sheets.get('Leads & Discovery Calls').getLastRow(), 2);
});
test('failure after the durable write is reconciled by status without another row', () => {
  const h = scriptHarness(), data = lead();
  let failed = false;
  h.context.SpreadsheetApp.flush = () => { if (!failed) { failed = true; throw new Error('lost response after durable write'); } };
  assert.equal(h.post({ action: 'capture', lead: data, clientKey: 'test' }).ok, false);
  assert.equal(h.post({ action: 'status', lead: { request_id: data.request_id }, clientKey: 'test' }).state, 'captured');
  assert.equal(h.post({ action: 'capture', lead: data, clientKey: 'test' }).ok, true);
  assert.equal(h.sheets.get('Leads & Discovery Calls').getLastRow(), 2);
});
test('unapproved email stays off and unauthorized sender fails before sending', () => {
  const h = scriptHarness(); h.post({ action: 'capture', lead: lead(), clientKey: 'test' });
  h.context.processSmartLearnNotifications(); assert.equal(h.sent.length, 0);
  mail(h); h.props.SENDER_EMAIL = 'unapproved@example.invalid';
  assert.throws(() => h.context.processSmartLearnNotifications(), /authorized/); assert.equal(h.sent.length, 0);
});
test('imported stop status suppresses the same contact before any website message is sent', () => {
  const h = scriptHarness(), data = lead(); h.post({ action: 'capture', lead: data, clientKey: 'test' }); mail(h);
  const sheet = h.sheets.get('Leads & Discovery Calls'), headers = sheet.rows[0];
  const imported = headers.map(() => ''); imported[headers.indexOf('Email')] = data.email; imported[headers.indexOf('Status')] = 'Stopped'; imported[2] = 'meta-lead-id'; sheet.rows.push(imported);
  h.context.processSmartLearnNotifications();
  assert.equal(h.sent.filter(args => args[0] === data.email).length, 0);
  assert.equal(h.sent.filter(args => args[0] === 'owner@example.invalid').length, 1);
});
test('booking confirmation has one owner; replay, reply and booking block prompts; cancellation for an old booking cannot erase a new one', () => {
  const h = scriptHarness(), data = lead(); const result = h.post({ action: 'capture', lead: data, clientKey: 'test' }); mail(h);
  const base = { leadId: result.leadId, email: data.email, host: 'Test Host', dateTime: '2026-10-30T10:00:00-07:00', timeZone: 'America/Vancouver', meetingUrl: 'https://example.invalid/meeting', rescheduleUrl: 'https://example.invalid/reschedule' };
  const event = { ...base, eventId: 'booking:1', type: 'booked', bookingId: 'new-booking', occurredAt: '2026-10-26T03:00:00Z' };
  h.post({ action: 'event', event });
  h.context.processSmartLearnNotifications(); assert.equal(h.sent.length, 1); // Owner only; calendar owns confirmation.
  h.props.BOOKING_CONFIRMATION_SYSTEM = 'adapter';
  h.context.processSmartLearnNotifications(); h.context.processSmartLearnNotifications();
  assert.equal(h.sent.filter(args => args[0] === data.email).length, 1);
  assert.ok(h.sent[1][2].includes('Test Host')); assert.ok(!/\[[^\]]+\]/.test(h.sent[1][2]));
  h.post({ action: 'event', event: { ...base, type: 'cancelled', bookingId: 'old-booking', eventId: 'old:cancel', occurredAt: '2026-10-26T04:00:00Z' } });
  assert.equal(JSON.parse(h.sheets.get('_SmartLearnState').rows[1][1]).booked, true);
  h.props.CAPTURE_ENABLED = 'false';
  assert.equal(h.post({ action: 'event', event: { type: 'replied', eventId: 'reply:1', email: data.email, occurredAt: new Date().toISOString() } }).ok, true);
});
test('suggested followups are inactive; approved cadence avoids duplicate and catch-up prompts', () => {
  const h = scriptHarness(), data = lead(); h.post({ action: 'capture', lead: data, clientKey: 'test' }); mail(h);
  h.context.processSmartLearnNotifications();
  const sheet = h.sheets.get('Leads & Discovery Calls'); sheet.rows[1][0] = '2026-10-01T10:00:00Z';
  h.context.processSmartLearnNotifications(); assert.equal(h.sent.length, 2);
  const stateSheet = h.sheets.get('_SmartLearnState'); stateSheet.rows[1][1] = '{}';
  h.props.FOLLOWUPS_ENABLED = 'true'; h.props.FOLLOWUP_BUSINESS_DAYS = '1,3';
  h.context.processSmartLearnNotifications(); h.context.processSmartLearnNotifications();
  assert.equal(h.sent.length, 3);
  assert.ok(h.sheets.get('_SmartLearnDelivery').rows.some(r => r[0].endsWith('followup:3')));
  assert.ok(!h.sheets.get('_SmartLearnDelivery').rows.some(r => r[0].endsWith('followup:1')));
});
