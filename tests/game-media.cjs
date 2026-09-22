const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch();
 try {
  for (const width of [320,390,760,1024,1440]) {
   const page = await browser.newPage({viewport:{width,height:1000}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
   await page.locator('[data-project="games"]').click();
   const photo=page.locator('.game-screenshot img'); await photo.evaluate(el=>el.decode());
   assert.ok(await photo.evaluate(el=>el.naturalWidth>0));
   const video=page.locator('video');
   assert.equal(await video.getAttribute('preload'),'none');
   assert.equal(await video.getAttribute('autoplay'),null);
   await video.evaluate(async el=>{el.muted=true;await el.play();});
   await page.waitForFunction(()=>document.querySelector('video').currentTime>0);
   await video.evaluate(el=>el.pause());
   assert.ok(await video.evaluate(el=>el.videoWidth===1920 && el.controls));
   await page.locator('canvas').scrollIntoViewIfNeeded();
   await page.locator('canvas').press('Enter');
   assert.equal(await page.locator('.pong-status').innerText(),'Game on');
   await page.locator('canvas').press('Escape');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.ok(await page.locator('#project-panel .game-story').evaluate(el=>[...el.querySelectorAll('img,video,canvas,h3,p')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})));
   await page.locator('#project-panel').screenshot({path:`/tmp/game-media-${width}.png`});
   await page.locator('[data-project="arcade"]').click();
   assert.equal(await page.locator('video:visible').count(),0);
   await page.locator('[data-project="games"]').click();
   assert.ok(await page.locator('video').evaluate(el=>el.paused));
   assert.equal(await page.locator('.pong-status').innerText(),'Press Enter to start');
   assert.deepEqual(errors,[]);
   console.log(`PASS game media, playback, Pong and responsive fit at ${width}px`);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
