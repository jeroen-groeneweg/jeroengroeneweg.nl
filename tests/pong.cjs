const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch();
 try {
  for (const width of [320, 390, 760, 1440]) {
   const page = await browser.newPage({viewport:{width,height:1000}});
   const errors = []; page.on('pageerror', error => errors.push(error.message));
   await page.clock.install();
   await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
   await page.locator('[data-project="games"]').click();
   const canvas = page.locator('.pong canvas');
   await canvas.scrollIntoViewIfNeeded();
   assert.equal(await page.locator('.pong-status').innerText(), 'Press Enter to start');
   await canvas.press('Enter');
   assert.equal(await page.locator('.pong-status').innerText(), 'Game on');
   await page.keyboard.down('ArrowUp'); await page.clock.runFor(300); await page.keyboard.up('ArrowUp');
   await canvas.press('Escape');
   assert.match(await page.locator('.pong-status').innerText(), /Paused/);
   await canvas.press('Enter');
   assert.equal(await page.locator('.pong-status').innerText(), 'Game on');
   await page.locator('.pong-start').click();
   assert.match(await page.locator('.pong-status').innerText(), /Paused/);
   await page.locator('.pong-start').click();
   // Let a complete match run with the player's paddle parked at the top.
   await page.keyboard.down('ArrowUp'); await page.clock.runFor(1000); await page.keyboard.up('ArrowUp');
   for (let i = 0; i < 120 && (await page.locator('.pong-status').innerText()) === 'Game on'; i++) await page.clock.runFor(1000);
   assert.match(await page.locator('.pong-status').innerText(), /wins|win!/);
   assert.match(await page.locator('.pong-score').innerText(), /5/);
   await canvas.press('Enter');
   assert.equal(await page.locator('.pong-score').innerText(), 'You 0 — 0 Computer');
   await canvas.press('Tab'); await canvas.press('Escape');
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
   await page.locator('#project-panel').screenshot({path:`/tmp/pong-${width}.png`});
   await page.locator('[data-project="home"]').click();
   assert.equal(await page.locator('.pong').count(), 0);
   await page.locator('[data-project="games"]').click();
   assert.equal(await page.locator('.pong-status').innerText(), 'Press Enter to start');
   assert.deepEqual(errors, []);
   console.log(`PASS Pong start, pause, win, restart, cleanup and fit at ${width}px`);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1});
