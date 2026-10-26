const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');
const leadId = 'b60c0ab8-6081-4496-9b1c-9c95d7a66b8b';
const live = { previewMode: false, leadEndpoint: '/api/leads', privacyUrl: 'https://example.invalid/privacy', bookingUrl: '', bookingEmail: 'info@smartlearn.ca' };
async function configure(page, cfg = live) {
  await page.route('**/assets/config.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.SMARTLEARN_CONFIG=${JSON.stringify(cfg)};` }));
}
async function business(page) {
  await page.locator('#business').fill('Test Plumbing');
  await page.locator('#industry').selectOption('Plumbing');
  await page.locator('#area').selectOption('Other');
  await page.locator('#team').fill('1');
  await page.locator('#challenge').selectOption('Paperwork and repeated data entry');
}
async function contact(page) {
  await page.locator('#name').fill('Test Person');
  await page.locator('#email').fill('test@example.invalid');
  await page.locator('#consent').check();
}

test('published privacy page is reachable, readable on mobile and returns to the inquiry', async ({ page }) => {
  await configure(page, { ...live, privacyUrl: 'https://smartlearn-funnel.polarisjumel.workers.dev/privacy.html' });
  await page.goto('/');
  await expect(page.locator('#privacy-link')).toHaveAttribute('href', 'https://smartlearn-funnel.polarisjumel.workers.dev/privacy.html');
  await expect(page.locator('.privacy-note')).toContainText('private Google Workspace tracker');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/privacy.html');
    expect(response.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveText('Privacy policy');
    await expect(page.locator('main')).toContainText('automatic deletion schedule');
    await expect(page.locator('main')).toContainText('Cloudflare');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.review/privacy-${width}.png`, fullPage: true });
  }
  await page.locator('main a.button').click();
  await expect(page).toHaveURL(/index\.html#discovery$/);
  await expect(page.locator('#discovery-form')).toBeVisible();
});
test('required fields, whitespace, malformed email, acknowledgment, keyboard order and back navigation', async ({ page }) => {
  await configure(page); await page.goto('/');
  await page.locator('#next-step').click();
  await expect(page.locator('#business')).toBeFocused();
  await expect(page.locator('#form-errors')).toBeVisible();
  await business(page); await page.locator('#business').press('Enter');
  await expect(page.locator('#name')).toBeFocused();
  await page.locator('#previous-step').click();
  await expect(page.locator('#business')).toBeFocused();
  await expect(page.locator('#business')).toHaveValue('Test Plumbing');
  await page.locator('#next-step').click();
  await page.locator('#name').fill('  '); await page.locator('#submit-button').click();
  await expect(page.locator('#name')).toBeFocused();
  await page.locator('#name').fill('Test Person'); await page.locator('#email').fill('bad');
  await page.locator('#submit-button').click(); await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('test@example.invalid'); await page.locator('#submit-button').click();
  await expect(page.locator('#consent')).toBeFocused();
  await page.locator('#email').focus(); await page.keyboard.press('Tab'); await expect(page.locator('#phone')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#consent')).toBeFocused();
});
test('valid capture has one POST under double click, no personal URL/storage and a separately verified handoff', async ({ page }) => {
  await configure(page);
  const requests = [];
  await page.route('**/api/leads', async route => {
    requests.push(route.request().postDataJSON());
    await new Promise(resolve => setTimeout(resolve, 100));
    await route.fulfill({ json: { ok: true, state: 'captured', leadId } });
  });
  await page.goto('/?utm_source=facebook&ad_id=123&unapproved=ignore');
  await business(page); await page.locator('#next-step').click(); await contact(page);
  await page.locator('#submit-button').evaluate(el => { el.click(); el.click(); });
  await expect(page).toHaveURL(/thank-you\.html$/);
  await expect(page.locator('#request-status')).toContainText('INQUIRY RECEIVED');
  expect(requests.filter(r => !r.action)).toHaveLength(1);
  expect(requests.filter(r => r.action === 'status')).toHaveLength(1);
  expect(requests[0].attribution).toEqual({ utm_source: 'facebook', ad_id: '123' });
  expect(page.url()).not.toContain('test');
  const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }));
  expect(stored).not.toContain('Test Person'); expect(stored).not.toContain('test@example');
  await expect(page.locator('#booking-button')).toBeHidden();
});
test('uncertain failure freezes input, reconciles and retries with the same ID and original payload', async ({ page }) => {
  await configure(page);
  const requests = []; let attempt = 0;
  await page.route('**/api/leads', async route => {
    const data = route.request().postDataJSON(); requests.push(data);
    if (data.action === 'status') return route.fulfill({ json: { ok: true, state: 'not_found' } });
    if (++attempt === 1) return route.fulfill({ status: 503, json: { ok: false, code: 'unconfirmed' } });
    return route.fulfill({ json: { ok: true, state: 'captured', leadId } });
  });
  await page.goto('/'); await business(page); await page.locator('#next-step').click(); await contact(page);
  await page.locator('#submit-button').click(); await expect(page.locator('#check-status')).toBeVisible();
  await expect(page.locator('#email')).toBeDisabled(); await expect(page).not.toHaveURL(/thank-you/);
  await page.locator('#check-status').click(); await expect(page.locator('#retry-request')).toBeVisible();
  await page.locator('#retry-request').click(); await expect(page).toHaveURL(/thank-you/);
  const captures = requests.filter(r => !r.action);
  expect(captures).toHaveLength(2); expect(captures[0]).toEqual(captures[1]);
});
for (const kind of ['malformed', 'timeout', 'server']) {
  test(`${kind} response never redirects to success`, async ({ page }) => {
    await configure(page);
    await page.route('**/api/leads', route => {
      if (kind === 'timeout') return route.abort('timedout');
      if (kind === 'malformed') return route.fulfill({ body: '<html>not JSON</html>' });
      return route.fulfill({ status: 500, json: { ok: false } });
    });
    await page.goto('/'); await business(page); await page.locator('#next-step').click(); await contact(page);
    await page.locator('#email').press('Enter');
    await expect(page.locator('#check-status')).toBeVisible(); await expect(page).not.toHaveURL(/thank-you/);
  });
}
test('direct handoff query cannot assert receipt; pending receipt requires server verification', async ({ page }) => {
  await configure(page); await page.goto('/thank-you.html?mode=received');
  await expect(page.locator('#request-status')).toHaveText('CALL TIME NOT YET CONFIRMED');
  await expect(page.locator('#thank-title')).toHaveText('Arrange your discovery call.');
  await page.evaluate(id => sessionStorage.setItem('smartlearn.receipt.v1', JSON.stringify({ request_id: id, at: Date.now() })), randomUUID());
  await page.route('**/api/leads', route => route.fulfill({ json: { ok: true, state: 'not_found' } }));
  await page.reload(); await expect(page.locator('#thank-description')).toContainText('cannot verify');
  await expect(page.locator('#request-status')).not.toContainText('INQUIRY RECEIVED');
});
test('preview submits no requests and invalid live config is visibly disabled', async ({ page }) => {
  let writes = 0; await page.route('**/api/leads', route => { writes++; return route.abort(); });
  await configure(page, { ...live, previewMode: true }); await page.goto('/');
  await business(page); await page.locator('#next-step').click(); await contact(page); await page.locator('#submit-button').click();
  await expect(page.locator('#request-status')).toContainText('PREVIEW COMPLETE'); expect(writes).toBe(0);
  await configure(page, { ...live, privacyUrl: '' }); await page.goto('/');
  await expect(page.locator('#form-errors')).toContainText('disabled');
  await page.locator('#next-step').click();
  expect(writes).toBe(0);
});
test('server field rejection allows correction using the same request ID', async ({ page }) => {
  await configure(page); const captures = [];
  await page.route('**/api/leads', route => {
    const data = route.request().postDataJSON();
    if (!data.action) captures.push(data);
    if (captures.length === 1 && !data.action) return route.fulfill({ status: 422, json: { ok: false, code: 'validation', errors: { team_size: 'Enter a whole number.' } } });
    return route.fulfill({ json: { ok: true, state: 'captured', leadId } });
  });
  await page.goto('/'); await business(page); await page.locator('#next-step').click(); await contact(page); await page.locator('#submit-button').click();
  await expect(page.locator('#team')).toBeFocused(); await expect(page.locator('#team')).toBeEnabled();
  await page.locator('#team').fill('12'); await page.locator('#next-step').click(); await page.locator('#submit-button').click();
  await expect(page).toHaveURL(/thank-you/); expect(captures).toHaveLength(2);
  expect(captures[1].request_id).toBe(captures[0].request_id); expect(captures[1].team_size).toBe('12');
});
test('reloaded pending inquiry is reconciled before any new capture attempt', async ({ page }) => {
  await configure(page); let captures = 0;
  await page.route('**/api/leads', route => {
    const data = route.request().postDataJSON();
    if (!data.action) { captures++; return route.abort('timedout'); }
    return route.fulfill({ json: { ok: true, state: 'captured', leadId } });
  });
  await page.goto('/'); await business(page); await page.locator('#next-step').click(); await contact(page); await page.locator('#submit-button').click();
  await expect(page.locator('#check-status')).toBeVisible(); await page.reload();
  await expect(page.locator('#business')).toBeDisabled(); await page.locator('#check-status').click();
  await expect(page).toHaveURL(/thank-you/); await expect(page.locator('#request-status')).toContainText('INQUIRY RECEIVED'); expect(captures).toBe(1);
});
test('returning from handoff permits a genuinely new request with a new ID', async ({ page }) => {
  await configure(page); const ids = [];
  await page.route('**/api/leads', route => { const data = route.request().postDataJSON(); if (!data.action) ids.push(data.request_id); return route.fulfill({ json: { ok: true, state: 'captured', leadId } }); });
  await page.goto('/'); await business(page); await page.locator('#next-step').click(); await contact(page); await page.locator('#submit-button').click();
  await expect(page).toHaveURL(/thank-you/); await page.goBack();
  await expect(page.locator('#business')).toBeEnabled(); await business(page); await page.locator('#next-step').click(); await contact(page); await page.locator('#submit-button').click();
  await expect(page).toHaveURL(/thank-you/); expect(ids).toHaveLength(2); expect(ids[0]).not.toBe(ids[1]);
});
test('headcount rejects fractions and zero while accepting solo teams and larger teams', async ({ page }) => {
  await page.goto('/'); await business(page);
  for (const count of ['0', '1.5']) { await page.locator('#team').fill(count); await page.locator('#next-step').click(); await expect(page.locator('#team')).toBeFocused(); await expect(page.locator('[data-step="1"]')).toBeVisible(); }
  await page.locator('#team').fill('51'); await page.locator('#next-step').click(); await expect(page.locator('#name')).toBeFocused();
});
for (const width of [320, 390, 1440]) {
  test(`landing, both form steps and handoff fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    expect(await fits()).toBe(true);
    await page.screenshot({ path: `.review/landing-${width}.png`, fullPage: true });
    await business(page); await page.locator('#next-step').click();
    expect(await fits()).toBe(true);
    await page.locator('#discovery').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.review/contact-${width}.png` });
    await page.goto('/thank-you.html'); expect(await fits()).toBe(true);
    await page.screenshot({ path: `.review/handoff-${width}.png`, fullPage: true });
  });
}
