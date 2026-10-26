const { test, expect } = require('@playwright/test');
for (const width of [320, 390, 768, 1440]) {
  test(`editorial layout, readable controls and complete workflow visual at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let posts = 0; page.on('request', r => { if (r.method() === 'POST') posts++; });
    await page.goto('/'); await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('h1')).toHaveText('Less time chasing paperwork.More time running your business.');
    await expect(page.locator('.card-stage,.float-card,.hero .eyebrow')).toHaveCount(0);
    const image = page.locator('.hero-art img');
    await expect(image).toBeVisible();
    expect(await image.evaluate(el => el.complete && el.naturalWidth > 0 && el.width <= innerWidth)).toBe(true);
    await expect(image).toHaveAttribute('width', '1200'); await expect(image).toHaveAttribute('height', '1200');
    const smallText = await page.locator('main p,main label,main input,main select,main summary,.label-note').evaluateAll(elements => elements.filter(el => el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 16).map(el => el.textContent));
    expect(smallText).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.review/redesign-${width}.png`, fullPage: true });
    await page.locator('#business').fill('Test Plumbing'); await page.locator('#industry').selectOption('Plumbing');
    await page.locator('#area').selectOption('Other'); await page.locator('#team').fill('1');
    await page.locator('#challenge').selectOption('Paperwork and repeated data entry');
    await page.locator('#business').press('Enter');
    await expect(page.locator('#name')).toBeFocused(); await expect(page.locator('#form-title')).toHaveText('Your contact details');
    await page.locator('#discovery-form').screenshot({ path: `.review/redesign-contact-${width}.png` });
    await page.locator('#previous-step').click(); await expect(page.locator('#form-title')).toHaveText('Your business');
    await page.locator('.faq summary').first().focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.faq details').first()).toHaveAttribute('open', '');
    expect(posts).toBe(0);
  });
}
test('keyboard focus, reduced motion and narrow reflow stay usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width: 640, height: 900 }); await page.goto('/');
  await page.keyboard.press('Tab'); await expect(page.locator('.skip')).toBeFocused();
  expect(await page.locator('.skip').evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/#main$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
