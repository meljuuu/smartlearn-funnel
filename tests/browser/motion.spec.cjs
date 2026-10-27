const { test, expect } = require('@playwright/test');
async function recordMotion(page) {
  await page.addInitScript(() => {
    window.motionCalls = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function(frames, options) {
      window.motionCalls.push({ target: this.className, duration: options.duration });
      return animate.call(this, frames, options);
    };
  });
}
test('buttons respond to hover/press and sections reveal once without hiding content', async ({ page }) => {
  await recordMotion(page); await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/'); const button = page.locator('.hero-cta');
  await button.hover();
  await expect.poll(() => button.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.mouse.down();
  await expect.poll(() => button.evaluate(el => getComputedStyle(el).transform)).toContain('0.98');
  await page.mouse.up();
  await page.locator('.approach-heading').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.motionCalls.filter(c => c.target === 'approach-heading').length)).toBe(1);
  await page.locator('.hero').scrollIntoViewIfNeeded(); await page.locator('.approach-heading').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.motionCalls.filter(c => c.target === 'approach-heading').length)).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.approach-heading').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  expect(await page.locator('.approach-heading').evaluate(el => el.getAnimations().length)).toBe(0);
  await page.screenshot({ path: '.review/motion-desktop.png', fullPage: true, animations: 'disabled' });
});
test('reduced motion and absent JavaScript leave content visible with no motion dependency', async ({ page, browser }) => {
  await recordMotion(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.locator('.steps').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.motionCalls.length)).toBe(0);
  expect(await page.locator('.hero-cta').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const plain = await context.newPage(); await plain.goto('http://127.0.0.1:4173/');
  await expect(plain.locator('.problem-story')).toBeVisible(); await expect(plain.locator('.steps')).toBeVisible();
  expect(await plain.locator('.steps').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await context.close();
});
