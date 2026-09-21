const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch();
 try {
  for (const width of [320, 760, 1440]) {
   const page = await browser.newPage({viewport:{width,height:950}});
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
   assert.equal(await page.locator('.project-photo').count(),7);
   const photo=page.locator('#project-panel .project-photo').first();
   await photo.scrollIntoViewIfNeeded();
   const img=photo.locator('img'); await img.evaluate(el=>el.decode());
   assert.equal(await img.evaluate(el=>getComputedStyle(el).filter),'grayscale(1)');
   await photo.hover(); await page.waitForTimeout(400);
   assert.equal(await img.evaluate(el=>getComputedStyle(el).filter),'grayscale(0)');
   await photo.focus(); await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog'); assert.ok(await dialog.isVisible());
   assert.equal(await dialog.locator('img').getAttribute('src'),await img.evaluate(el=>el.currentSrc));
   assert.equal(await dialog.locator('img').evaluate(el=>getComputedStyle(el).filter),'none');
   await page.keyboard.press('Tab'); assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)));
   await page.keyboard.press('Escape'); assert.equal(await dialog.isVisible(),false);
   assert.ok(await photo.evaluate(el=>el===document.activeElement));
   await photo.click(); await page.getByRole('button',{name:'Close enlarged photo'}).click();
   assert.equal(await dialog.isVisible(),false);
   await photo.click(); await page.mouse.click(2,2); assert.equal(await dialog.isVisible(),false);
   await page.locator('[data-project="games"]').click();
   const gamePhoto=page.locator('#project-panel .project-photo'); await gamePhoto.click();
   await dialog.locator('img').evaluate(el=>el.decode());
   assert.ok(await dialog.locator('img').evaluate(el=>el.naturalWidth>0));
   assert.ok(await dialog.evaluate(el=>el.getBoundingClientRect().width<=innerWidth));
   await page.screenshot({path:`/tmp/photo-modal-${width}.png`});
   await page.keyboard.press('Escape');
   await page.waitForFunction(() => !document.body.classList.contains('photo-modal-open'));
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.ok(await gamePhoto.locator('img').evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration) <= 0.00001));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.evaluate(()=>document.body.classList.contains('photo-modal-open')),false);
   console.log(`PASS photo hover, modal, keyboard, backdrop, focus and fit at ${width}px`);
   await page.close();
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
