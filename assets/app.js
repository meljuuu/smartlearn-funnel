(() => {
  'use strict';
  const cfg = window.SMARTLEARN_CONFIG || {};
  const https = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } };
  const preview = cfg.previewMode === true;
  const live = cfg.previewMode === false && cfg.leadEndpoint === '/api/leads' && https(cfg.privacyUrl);
  const pendingKey = 'smartlearn.pending.v1', receiptKey = 'smartlearn.receipt.v1';
  const storage = {
    get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    remove(key) { try { sessionStorage.removeItem(key); } catch { /* Opaque IDs only. */ } }
  };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  document.querySelectorAll('[data-preview]').forEach(el => {
    el.hidden = live;
    if (!preview && !live) el.textContent = 'Requests are unavailable: live configuration is incomplete. Please contact info@smartlearn.ca.';
  });
  async function request(data) {
    const response = await fetch(cfg.leadEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(25000), credentials: 'same-origin', cache: 'no-store'
    });
    const body = await response.json();
    if (!response.ok || body.ok !== true) { const error = new Error(body.code || 'unconfirmed'); error.status = response.status; error.fields = body.errors; throw error; }
    return body;
  }
  function captured(body) { return body.state === 'captured' && uuid.test(body.leadId || ''); }
  const form = document.querySelector('#discovery-form');
  if (form) {
    const steps = [...form.querySelectorAll('[data-step]')], errors = form.querySelector('#form-errors');
    const button = document.querySelector('#submit-button'), next = document.querySelector('#next-step');
    const check = document.querySelector('#check-status'), retry = document.querySelector('#retry-request');
    const fields = [...form.querySelectorAll('input, select')];
    let step = 1, busy = false, frozen = null;
    let pending = storage.get(pendingKey);
    if (!uuid.test(pending?.request_id || '')) pending = null;
    const error = text => { errors.textContent = text; errors.hidden = false; errors.focus(); };
    const lock = value => { fields.forEach(el => el.disabled = value); next.disabled = value; document.querySelector('#previous-step').disabled = value; button.disabled = value; };
    const show = n => {
      step = n;
      steps.forEach((el, i) => { el.hidden = i !== n - 1; el.disabled = i !== n - 1; });
      document.querySelector('#step-label').textContent = `Step ${n} of 2`;
      document.querySelector('#progress').style.width = `${n * 50}%`;
      errors.hidden = true;
      steps[n - 1].querySelector('input,select')?.focus();
    };
    const validate = current => {
      const invalid = [];
      current.querySelectorAll('input,select').forEach(el => {
        const bad = (el.required && el.type !== 'checkbox' && !el.value.trim()) || !el.checkValidity();
        el.setAttribute('aria-invalid', String(bad));
        if (bad) invalid.push(el);
      });
      if (!invalid.length) { errors.hidden = true; return true; }
      const label = invalid[0].labels?.[0]?.textContent.trim() || 'the highlighted field';
      error(`Please check ${label}. Complete required fields, enter a valid email and acknowledge contact about this inquiry.`);
      invalid[0].setAttribute('aria-describedby', 'form-errors');
      invalid[0].focus();
      return false;
    };
    function finish(body) {
      if (!captured(body)) throw new Error('unconfirmed');
      storage.remove(pendingKey);
      const previous = storage.get(receiptKey);
      const alreadyEmitted = previous?.request_id === pending.request_id && previous.eventEmitted === true;
      if (!storage.set(receiptKey, { request_id: pending.request_id, at: Date.now(), eventEmitted: true })) {
        error('Your inquiry was received. A call time is not yet confirmed. Contact info@smartlearn.ca to arrange it.');
        return;
      }
      if (!alreadyEmitted) window.dispatchEvent(new CustomEvent('smartlearn:captured', { detail: { eventId: body.leadId } }));
      form.reset();
      location.assign('thank-you.html');
    }
    async function reconcile() {
      if (busy || !pending || !live) return;
      busy = true; check.disabled = true; retry.hidden = true;
      try {
        const body = await request({ action: 'status', request_id: pending.request_id });
        if (captured(body)) { finish(body); return; }
        if (body.state !== 'not_found') throw new Error('unconfirmed');
        if (frozen) {
          error('No saved inquiry was found. You can retry the same request below. Its request ID will be reused to prevent duplicates.');
          retry.hidden = false;
        } else {
          lock(false); pending.reconciled = true;
          error('No saved inquiry was found. Re-enter your details to retry with the same request ID.');
          check.hidden = true;
        }
      } catch {
        error('We still cannot confirm this request. Check its status again, or contact info@smartlearn.ca before starting another inquiry.');
      } finally { busy = false; check.disabled = false; }
    }
    async function send() {
      if (busy) return;
      busy = true; lock(true); retry.hidden = true; check.hidden = true; button.textContent = 'Sending your request…';
      try { finish(await request(frozen)); }
      catch (failure) {
        if (failure.status === 422 && failure.message === 'validation') {
          lock(false); pending.reconciled = true; frozen = null;
          const field = fields.find(el => failure.fields?.[el.name]);
          if (field) show(steps[0].contains(field) ? 1 : 2);
          error('The server rejected these details. Correct the highlighted field before trying again; the same request ID will be retained.');
          if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'form-errors'); field.focus(); }
        } else {
          error(failure.status === 409 ? 'This request ID already belongs to an inquiry with different details. Check its status and contact info@smartlearn.ca to correct the original inquiry.' : 'We could not confirm receipt. Your request may still be processing. Check its status before retrying; your details remain on this page.');
          check.hidden = false;
        }
      } finally { busy = false; button.textContent = 'Request my free discovery call ↗'; }
    }
    next.addEventListener('click', () => { if (!busy && validate(steps[0])) show(2); });
    document.querySelector('#previous-step').addEventListener('click', () => { if (!busy) show(1); });
    form.addEventListener('keydown', event => {
      if (event.key === 'Enter' && step === 1 && event.target.matches('input')) { event.preventDefault(); next.click(); }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || (pending && !pending.reconciled)) return;
      if (step === 1) { if (validate(steps[0])) show(2); return; }
      if (!validate(steps[1])) return;
      if (!preview && !live) { error('Live requests are unavailable until capture and the approved privacy policy are configured. Contact info@smartlearn.ca.'); return; }
      if (form.elements.website_url.value) { error('Unable to accept this request.'); return; }
      if (preview) {
        storage.set(receiptKey, { preview: true, at: Date.now() });
        form.reset(); location.assign('thank-you.html'); return;
      }
      const data = {};
      for (const field of fields) if (field.name) data[field.name] = field.type === 'checkbox' ? field.checked : field.value.trim();
      pending ||= { request_id: crypto.randomUUID(), at: Date.now() };
      delete pending.reconciled;
      if (!storage.set(pendingKey, pending)) { error('Please enable session storage to safely track this request, or contact info@smartlearn.ca. Nothing has been sent.'); pending = null; return; }
      data.request_id = pending.request_id;
      const query = new URLSearchParams(location.search);
      data.attribution = {};
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ad_id', 'adset_id', 'campaign_id']) {
        if (query.has(key)) data.attribution[key] = query.get(key).slice(0, 200);
      }
      frozen = data;
      await send();
    });
    check.addEventListener('click', reconcile);
    retry.addEventListener('click', send);
    const privacy = document.querySelector('#privacy-link'), dialog = document.querySelector('#privacy-dialog');
    if (https(cfg.privacyUrl)) { privacy.href = cfg.privacyUrl; privacy.target = '_blank'; privacy.rel = 'noopener'; privacy.textContent = 'Privacy policy'; }
    else privacy.addEventListener('click', e => { e.preventDefault(); dialog.showModal(); });
    document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    if (!preview && !live) { button.disabled = true; error('Live submission is disabled because configuration is incomplete. Contact info@smartlearn.ca.'); }
    if (pending && live) { lock(true); check.hidden = false; error('A previous request needs a status check before another submission. No contact details are stored in your browser.'); }
    window.addEventListener('pageshow', event => {
      if (!event.persisted || busy) return;
      const saved = storage.get(pendingKey);
      if (!saved && pending) { pending = null; frozen = null; lock(false); check.hidden = true; retry.hidden = true; show(1); }
    });
  }
  if (document.querySelector('#thank-content')) {
    const title = document.querySelector('#thank-title'), description = document.querySelector('#thank-description');
    const status = document.querySelector('#request-status');
    title.textContent = 'Arrange your discovery call.';
    description.textContent = 'Contact the SmartLearn team to arrange a time. This page does not confirm an inquiry or an appointment.';
    status.textContent = 'CALL TIME NOT YET CONFIRMED';
    const booking = document.querySelector('#booking-button');
    if (https(cfg.bookingUrl)) { booking.href = cfg.bookingUrl; booking.hidden = false; }
    else { document.querySelector('#booking-note').hidden = false; }
    const receipt = storage.get(receiptKey);
    if (receipt?.preview && preview && Date.now() - receipt.at < 3600000) {
      status.textContent = 'PREVIEW COMPLETE · NO INFORMATION SENT';
      description.textContent = 'This was a preview. No inquiry was saved, no email was sent and no appointment was booked.';
    } else if (live && uuid.test(receipt?.request_id || '') && Date.now() - receipt.at < 3600000) {
      description.textContent = 'Checking whether your inquiry was received… Your call time is confirmed separately.';
      request({ action: 'status', request_id: receipt.request_id }).then(body => {
        if (!captured(body)) throw new Error('unconfirmed');
        title.textContent = 'Thanks for your inquiry.';
        description.textContent = 'Your inquiry was received. Choose a time if booking is available, or email the team to arrange your discovery call.';
        status.textContent = 'INQUIRY RECEIVED · CALL TIME NOT YET CONFIRMED';
      }).catch(() => { description.textContent = 'We cannot verify receipt right now. Contact info@smartlearn.ca before submitting another inquiry. No appointment is confirmed.'; });
    }
  }
})();
