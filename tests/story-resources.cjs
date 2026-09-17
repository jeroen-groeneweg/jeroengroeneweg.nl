const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const resources = [...html.matchAll(/<div class="story-resource">([\s\S]*?)<\/div>/g)];
assert.equal(resources.length, 28, 'Every chapter should have a resource');
const urls = new Set();
const titles = new Set();
let sreBookCount = 0;
for (const [, resource] of resources) {
  const link = resource.match(/<a href="([^"]+)">([^<]+)<\/a>/);
  assert.ok(link, 'Resource must contain a link');
  const url = new URL(link[1]);
  const canonical = url.origin + url.pathname.replace(/\/$/, '');
  const title = link[2].toLowerCase().trim();
  assert.ok(!urls.has(canonical), 'Duplicate resource URL: ' + canonical);
  assert.ok(!titles.has(title), 'Duplicate resource title: ' + title);
  urls.add(canonical);
  titles.add(title);
  if (url.hostname === 'sre.google' && url.pathname.startsWith('/sre-book/')) {
    sreBookCount += 1;
  }
}
assert.ok(sreBookCount <= 1, 'Do not repeat chapters from the same SRE book');
console.log('PASS: 28 unique chapter resources');
