const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 760, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      const contact = page.locator('#contact');
      assert.equal(await contact.locator('a').count(), 3);
      assert.equal(await contact.getByRole('link', { name: 'Connect on LinkedIn' }).locator('svg[aria-hidden="true"]').count(), 1);
      assert.equal(await contact.getByRole('link', { name: 'jeroen.groeneweg@gmail.com' }).getAttribute('href'), 'mailto:jeroen.groeneweg@gmail.com');
      assert.equal(await contact.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(246, 238, 227)');
      const pdf = await contact.getByRole('link', { name: 'Download my résumé' }).getAttribute('href');
      assert.equal(fs.readFileSync(path.resolve(__dirname, '..', pdf)).subarray(0, 5).toString(), '%PDF-');
      assert.ok(await contact.evaluate(el => [...el.querySelectorAll('a, h2, p')].every(child => {
        const rect = child.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth;
      })));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await contact.locator('.contact-sparks').evaluate(el => getComputedStyle(el).animationName), 'none');
      await contact.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/contact-${width}.png` });
      await page.close();
      console.log(`PASS contact at ${width}px`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
