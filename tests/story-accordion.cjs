const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

// Run with: node tests/story-accordion.cjs
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, reducedMotion] of [[1440, 'no-preference'], [390, 'no-preference'], [390, 'reduce']]) {
      const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion });
      await page.addInitScript(() => {
        const originalScrollTo = window.scrollTo.bind(window);
        window.storyScrollBehaviors = [];
        window.scrollTo = (...args) => {
          if (args[0] && typeof args[0] === 'object') {
            window.storyScrollBehaviors.push(args[0].behavior);
          }
          return originalScrollTo(...args);
        };
      });
      await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      const year = (number) => page.locator('#bridgefund-year-' + number);
      const chapter = (number) => page.locator('#bridgefund-year-1-chapter-' + number);
      const openCount = () => page.locator('.bridgefund-story details[open]').count();
      const activate = async (item, key) => {
        await item.locator(':scope > summary').focus();
        await page.keyboard.press(key);
      };
      const expectOpen = async (item, open) => {
        await page.waitForFunction(
          ({ id, expected }) => document.getElementById(id).open === expected,
          { id: await item.getAttribute('id'), expected: open },
        );
      };
      const expectAligned = async (item) => {
        await page.waitForFunction((id) => {
          const summary = document.getElementById(id).querySelector(':scope > summary');
          const navHeight = document.querySelector('.nav').getBoundingClientRect().height;
          return Math.abs(summary.getBoundingClientRect().top - navHeight - 16) < 2;
        }, await item.getAttribute('id'));
      };
      assert.equal(await openCount(), 0);
      assert.equal(await page.locator('.story-takeaway .story-resource').count(), 0);
      assert.equal(await page.locator('.story-chapter-body > .story-resource').count(), 28);
      await activate(year(1), 'Enter');
      await expectAligned(year(1));
      await activate(chapter(1), 'Space');
      await expectOpen(chapter(1), true);
      await expectAligned(chapter(1));
      assert.ok(await chapter(1).locator('.story-chapter-body').evaluate(
        (element) => element.getBoundingClientRect().width <= 780,
      ));
      await activate(chapter(2), 'Enter');
      await expectOpen(chapter(1), false);
      await expectOpen(chapter(2), true);
      await expectAligned(chapter(2));
      // Switching back upwards must also align after the previous content closes.
      await chapter(1).locator(':scope > summary').click();
      await expectAligned(chapter(1));
      const nextHeading = chapter(2).locator(':scope > summary');
      await nextHeading.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const heading = document.querySelector('#bridgefund-year-1-chapter-2 > summary');
        heading.addEventListener('click', () => {
          const before = heading.getBoundingClientRect().top;
          requestAnimationFrame(() => {
            window.headingJump = Math.abs(heading.getBoundingClientRect().top - before);
          });
        }, { capture: true, once: true });
      });
      await nextHeading.click();
      await page.waitForFunction(() => typeof window.headingJump === 'number');
      assert.ok(await page.evaluate(() => window.headingJump < 2), 'heading must not jump before smooth scrolling');
      await expectAligned(chapter(2));
      await expectOpen(year(1), true);
      assert.equal(await openCount(), 2);
      // Recaps participate in the same chapter group.
      await year(1).locator('.story-recap > summary').click();
      await expectOpen(chapter(2), false);
      assert.equal(await openCount(), 2);
      await year(2).locator(':scope > summary').click();
      await expectAligned(year(2));
      await expectOpen(year(1), false);
      await page.waitForFunction(() =>
        document.querySelectorAll('.story-year:not([open]) details[open]').length === 0,
      );
      assert.equal(await openCount(), 1);
      await activate(year(1), 'Enter');
      await expectAligned(year(1));
      await expectOpen(year(2), false);
      assert.equal(await openCount(), 1);
      await activate(chapter(1), 'Enter');
      await activate(year(1), 'Enter');
      await expectOpen(chapter(1), false);
      assert.equal(await openCount(), 0);
      assert.equal(
        await year(1).locator('.story-year-body').evaluate((element) =>
          getComputedStyle(element).backgroundColor),
        'rgb(255, 255, 255)',
      );
      const behaviors = await page.evaluate(() => window.storyScrollBehaviors);
      assert.ok(behaviors.length > 0);
      assert.ok(behaviors.includes('instant'), 'layout compensation is synchronous');
      assert.ok(reducedMotion === 'reduce'
        ? behaviors.every((behavior) => behavior === 'instant')
        : behaviors.includes('smooth'));
      console.log('PASS ' + width + ' ' + reducedMotion + ': accordion, alignment and scroll preference');
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
