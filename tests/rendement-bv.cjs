const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 760, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(pathToFileURL(path.resolve(__dirname, '../rendement-bv/index.html')).href);
      assert.deepEqual(errors, []);
      assert.equal(await page.locator('.opt').count(), 6);
      assert.equal(await page.locator('#chart polyline').count(), 6);
      assert.equal(await page.locator('#tbl tbody tr').count(), 11);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal page scroll at ${width}px`);
      // Bank bucket above €100k is flagged
      await page.fill('#a2', '150000');
      await page.locator('#a2').dispatchEvent('change');
      assert.match(await page.locator('#st-a2').innerText(), /boven de garantiegrens/);
      await page.screenshot({ path: `/tmp/rendement-bv-${width}.png`, fullPage: true });
      await page.close();
      console.log(`PASS rendement-bv at ${width}px`);
    }
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
