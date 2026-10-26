/* Also paste this file into an Apps Script file named Core.gs. No dependencies. */
var SmartLearnCore = (() => {
  'use strict';
  const choices = {
    business_type: ['HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Cleaning', 'Roofing', 'Renovation', 'Property maintenance', 'Other'],
    service_area: ['Surrey', 'Langley', 'Surrey and Langley', 'Other'],
    team_size: ['1', '2–5', '6–10', '11–25', '26–50', '51+'],
    main_challenge: ['Customer inquiries and follow-ups', 'Scheduling and coordination', 'Quotes and invoicing', 'Paperwork and repeated data entry', 'Other administrative work']
  };
  const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ad_id', 'adset_id', 'campaign_id'];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  function https(value) {
    return typeof value === 'string' && /^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?(?:[/?#][^\s]*)?$/i.test(value);
  }
  function validateLead(input) {
    const errors = {}, value = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { form: 'Invalid request.' } };
    if (!uuid.test(input.request_id || '')) errors.request_id = 'A valid request ID is required.';
    else value.request_id = input.request_id.toLowerCase();
    for (const [key, max] of Object.entries({ business_name: 160, full_name: 120, email: 180, phone: 40 })) {
      const text = typeof input[key] === 'string' ? input[key].trim() : '';
      if ((!text && key !== 'phone') || text.length > max || /[\x00-\x1f\x7f]/.test(text)) errors[key] = `Check ${key.replaceAll('_', ' ')} (maximum ${max} characters).`;
      value[key] = text;
    }
    value.email = value.email.toLowerCase();
    if (!email.test(value.email)) errors.email = 'Enter a valid email address.';
    for (const [key, allowed] of Object.entries(choices)) {
      if (!allowed.includes(input[key])) errors[key] = 'Choose one of the available options.';
      else value[key] = input[key];
    }
    if (input.contact_consent !== true) errors.contact_consent = 'Acknowledge contact about this inquiry.';
    value.contact_consent = true;
    if (input.website_url) errors.form = 'Unable to accept this request.';
    value.attribution = {};
    if (input.attribution && typeof input.attribution === 'object') {
      for (const key of attributionKeys) {
        if (typeof input.attribution[key] === 'string') value.attribution[key] = input.attribution[key].replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200);
      }
    }
    return { value, errors };
  }
  // Prefix before writing user strings with Sheets' USER_ENTERED semantics.
  function cell(value) { const text = String(value == null ? '' : value); return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text; }
  function firstName(name) { return String(name || '').trim().split(/\s+/)[0]; }
  function message(kind, lead, cfg, event) {
    const name = firstName(lead.full_name), business = lead.business_name;
    const booking = https(cfg.bookingUrl) ? `Choose a time here: ${cfg.bookingUrl}, or reply and we’ll help arrange one.` : 'Reply and we’ll help arrange a time.';
    if (kind === 'ack') return { subject: 'Your SmartLearn discovery-call inquiry', body: `Hi ${name}, thanks for your interest in SmartLearn. Our free AI & Digitization Discovery Call is a chance to discuss the work you would like to simplify. ${booking} — The SmartLearn team` };
    if (kind.startsWith('followup:')) {
      if (!https(cfg.bookingUrl)) throw new Error('Booking URL required for booking prompts');
      return { subject: 'Your SmartLearn inquiry', body: `Hi ${name}, just following up on your SmartLearn inquiry. If you would still like to explore a clearer workflow for ${business}, choose a time here: ${cfg.bookingUrl}. You can also reply if you need help. — The SmartLearn team` };
    }
    if (kind === 'confirmation') {
      if (!event || !event.host || !event.dateTime || !event.timeZone || !https(event.meetingUrl) || !https(event.rescheduleUrl)) throw new Error('Verified calendar details required');
      return { subject: 'Your SmartLearn discovery call', body: `Hi ${name}, your call with ${event.host} is booked for ${event.dateTime} (${event.timeZone}). Join: ${event.meetingUrl}. Please think about the task taking up the most time and the tools your team uses. To change the time: ${event.rescheduleUrl}. — The SmartLearn team` };
    }
    if (kind === 'owner') return { subject: 'New SmartLearn discovery-call inquiry', body: `A new inquiry from ${lead.full_name} at ${business} is ready for review.\nTracker: ${cfg.trackerUrl}\nLead ID: ${lead.leadId}\nThis is an inquiry; a call time has not been confirmed.` };
    if (kind === 'after-discovery') {
      if (!event || ['priorityProblem', 'nextStep', 'owner', 'action', 'agreedDate', 'sender'].some(key => !event[key])) throw new Error('Agreed discovery outcome required');
      return { subject: 'Your SmartLearn next steps', body: `Hi ${name}, thanks for speaking with us. We discussed ${event.priorityProblem} and agreed ${event.nextStep}. ${event.owner} will ${event.action} by ${event.agreedDate}. Please reply if anything needs correcting. — ${event.sender}, SmartLearn` };
    }
    throw new Error('Unknown message');
  }
  function businessDaysElapsed(start, end, timeZone) {
    const parts = date => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
    const day = date => { const p = Object.fromEntries(parts(date).map(x => [x.type, x.value])); return Date.UTC(+p.year, +p.month - 1, +p.day); };
    let cursor = day(start), last = day(end), count = 0;
    while (cursor < last) { cursor += 86400000; if (![0, 6].includes(new Date(cursor).getUTCDay())) count++; }
    return count;
  }
  function promptsAllowed(state) { return !state.stopped && !state.replied && !state.booked && !state.cancelled && !state.manualHold; }
  return { choices, attributionKeys, uuid, email, https, validateLead, cell, message, businessDaysElapsed, promptsAllowed };
})();
if (typeof module !== 'undefined') module.exports = SmartLearnCore;
