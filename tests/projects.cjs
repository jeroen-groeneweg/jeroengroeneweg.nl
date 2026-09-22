const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 760, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      const panel = page.locator('#project-panel');
      const tabsBox = await page.locator('.project-tabs').boundingBox();
      const panelBox = await panel.boundingBox();
      const layoutBox = await page.locator('.project-layout').boundingBox();
      assert.ok(tabsBox.y + tabsBox.height <= panelBox.y, 'Project buttons sit above content');
      assert.ok(Math.abs(panelBox.width - layoutBox.width) < 1, 'Project uses the full layout width');
      const introWidth = await page.locator('.project-intro').evaluate(el => el.getBoundingClientRect().width);
      assert.ok(introWidth <= 800);
      if (width === 1440) assert.equal(introWidth, 800);

      await page.evaluate(() => document.fonts.ready);
      const textOffsets = await page.evaluate(() => ['.arcade .project-text', '.game-story-copy:not(.home-story-copy)', '.home-story-copy'].map(selector => {
        const block = document.querySelector(selector);
        return [...block.children].slice(0, 3).map(child => ({
          top: child.getBoundingClientRect().top - block.getBoundingClientRect().top,
          font: getComputedStyle(child).font,
          margin: getComputedStyle(child).margin,
        }));
      }));
      assert.deepEqual(textOffsets[0], textOffsets[1], 'Arcade and game text use identical offsets and typography');
      assert.deepEqual(textOffsets[1], textOffsets[2], 'Game and smart-home text use identical offsets and typography');
      const stageHeight = await panel.evaluate(el => el.getBoundingClientRect().height);
      const contactTop = await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top + scrollY);
      for (const project of ['games', 'home', 'arcade']) {
        await page.locator(`[data-project="${project}"]`).focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator(`[data-project="${project}"]`).getAttribute('aria-selected'), 'true');
        assert.ok(await panel.evaluate((el, name) => el.classList.contains(name), project));
        assert.ok(Math.abs((await panel.boundingBox()).height - stageHeight) < 1, 'Equal panel height');
        assert.ok(Math.abs(await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top + scrollY) - contactTop) < 1, 'No content jump');
        assert.equal(await page.locator('.project-inactive:not([inert])').count(), 0);

      }
      assert.equal(await panel.locator('img').count(), 6);
      for (const img of await panel.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
        assert.ok(await img.evaluate(el => el.naturalWidth > 0 && Boolean(el.alt)));
      }
      assert.match(await panel.locator('.arcade-link').getAttribute('href'), /^https:\/\/www.arcadewinkel.nl\/blog\//);
      await page.locator('[data-project="home"]').click();
      assert.deepEqual(await panel.locator('.home-links a').evaluateAll(links => links.map(link => link.href)), [
        'https://www.home-assistant.io/',
        'https://shop.everythingsmart.io/products/everything-presence-pro',
        'https://z-wavealliance.org/',
      ]);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await panel.evaluate(el => [...el.querySelectorAll('img, h3, p, a, figcaption')].every(child => {
        const r = child.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth;
      })));
      await panel.screenshot({ path: `/tmp/arcade-project-${width}.png` });
      await page.close();
      console.log(`PASS arcade story and project switching at ${width}px`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
