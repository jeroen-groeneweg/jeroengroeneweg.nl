const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 760, 820, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      await page.evaluate(() => document.fonts.ready);
      const logo = page.getByRole('link', { name: 'Jeroen Groeneweg home' });
      const first = logo.locator('.wordmark-first');
      assert.equal(await first.evaluate(el => el.getBoundingClientRect().width), 0);
      await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.nav').classList.contains('is-scrolled'));
      await page.waitForTimeout(900);
      assert.ok(await first.evaluate(el => el.getBoundingClientRect().width > 30));
      assert.equal(await logo.locator('.wordmark-dot').evaluate(el => getComputedStyle(el).opacity), '0');
      assert.ok(await logo.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const other = document.querySelector(innerWidth <= 760 ? '.menu-button' : '.nav-links').getBoundingClientRect();
        return rect.left >= 0 && rect.right + 8 <= other.left && rect.top >= 0;
      }), `Navigation overlap at ${width}px`);
      if (width <= 760) {
        await page.getByRole('button', { name: 'Menu' }).click();
        assert.equal(await page.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded'), 'true');
      }
      await page.screenshot({ path: `/tmp/wordmark-${width}.png` });
      await page.reload();
      await page.waitForFunction(() => document.querySelector('.nav').classList.contains('is-scrolled'));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await first.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
      await logo.click();
      await page.waitForFunction(() => window.scrollY === 0 && !document.querySelector('.nav').classList.contains('is-scrolled'));
      assert.equal(await first.evaluate(el => el.getBoundingClientRect().width), 0);
      assert.equal(await logo.locator('.wordmark-dot').evaluate(el => getComputedStyle(el).opacity), '1');
      await page.close();
      console.log(`PASS wordmark at ${width}px`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
