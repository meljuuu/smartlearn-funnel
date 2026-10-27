const { randomUUID } = require('node:crypto');
async function verifyAdapter(send, capture = false) {
  const health = await send('health', {});
  if (!health.ok || health.schema !== 'ready') throw new Error('Adapter schema or signing check failed.');
  if (health.leadContract !== 'generic-2026-10-27') throw new Error('Update the existing Apps Script web-app deployment to the October 27 generic-form adapter before enabling the revised form.');
  if (health.emailEnabled || health.followupsEnabled) throw new Error('Disable EMAIL_ENABLED and FOLLOWUPS_ENABLED before integration verification.');
  if (!capture) return { schema: 'ready', ...health };
  if (!health.testCaptureEnabled) throw new Error('Set TEST_CAPTURE_ENABLED=true in Apps Script properties for this synthetic-only test.');
  const id = randomUUID();
  const lead = { request_id: id, business_name: `SYNTHETIC INTEGRATION TEST ${id.slice(0, 8)}`, business_type: '', service_area: '', team_size: '', main_challenge: 'SYNTHETIC: copying inquiry details into quotes and invoices.', full_name: 'SYNTHETIC TEST - DO NOT CONTACT', email: 'smartlearn-synthetic@example.invalid', phone: '', contact_consent: true, attribution: { utm_source: 'integration_test', concept: 'evening-paperwork' } };
  let leadId;
  try {
    // Concurrent clients share no Worker-local memory; all deduplication lives in Google.
    const results = await Promise.allSettled(Array.from({ length: 3 }, () => send('test_capture', { lead, clientKey: 'synthetic-verification' })));
    const status = await send('status', { lead: { request_id: id }, clientKey: 'synthetic-verification' });
    if (!status.ok || status.state !== 'captured' || !status.leadId) throw new Error('Capture was not confirmed. Reconcile in the tracker using the request ID before retrying.');
    leadId = status.leadId;
    for (const result of results) if (result.status === 'fulfilled' && result.value.ok && result.value.leadId !== leadId) throw new Error('Concurrent responses disagree; inspect tracker duplicates.');
    const replay = await send('test_capture', { lead, clientKey: 'synthetic-verification' });
    if (!replay.ok || replay.leadId !== leadId) throw new Error('Replay did not resolve to the captured ID.');
    return { schema: 'ready', requestId: id, leadId, concurrentAttempts: 3, captured: true, replayMatched: true, trackerRowCountCheck: 'Inspect Website request ID in the actual tracker; there must be exactly one matching row.' };
  } catch (error) { error.requestId = id; throw error; }
  finally {
    try {
      const disabled = await send('end_test', {});
      if (!disabled.ok) throw new Error('Set TEST_CAPTURE_ENABLED=false manually; test-gate reset was not confirmed.');
    } catch (error) { error.requestId = id; throw error; }
  }
}
module.exports = { verifyAdapter };
