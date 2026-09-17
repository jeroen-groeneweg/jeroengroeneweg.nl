const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 760, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 } });
      await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      const cards = page.locator('.resume-card');
      assert.equal(await cards.count(), 3);
      assert.deepEqual(await cards.locator('h3').allTextContents(), ['BridgeFund', 'DPG Media', 'Tweakers']);
      assert.equal(await cards.locator('li').count(), 14);
      assert.equal(await page.locator('.case-studies .eyebrow').textContent(), 'Earlier Work');
      assert.ok(!(await cards.allTextContents()).join('').includes('METRIC NEEDED'));
      assert.ok(await page.evaluate(() => {
        const matching = (first, second) => {
          const a = getComputedStyle(document.querySelector(first));
          const b = getComputedStyle(document.querySelector(second));
          return ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'].every(property => a[property] === b[property]);
        };
        return matching('.resume-card li', '.story-chapter-body > p')
          && matching('.resume-card h3', '.story-chapter h4');
      }), 'Card body and heading typography should match story chapters');
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(img => img.decode());
        assert.ok(await card.evaluate(el => el.scrollWidth <= el.clientWidth));
        assert.equal(await card.locator('ul').evaluate(el => getComputedStyle(el).columnCount), width <= 760 ? '1' : '2');
      }
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.case-studies').screenshot({ path: `/tmp/resume-cards-${width}.png` });
      await page.close();
      console.log(`PASS résumé cards at ${width}px`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
