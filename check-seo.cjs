// Static site: the HTML files are the production output. No build is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const origin = 'https://www.arayafilms.com';
const pages = ['index.html', 'video.html', 'photo.html', 'about.html', 'contact.html'];
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const clean = html => html.replace(/<!--[\s\S]*?-->/g, '');
const attributes = tag => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1], match[3]])
);
const titles = new Set();
const descriptions = new Set();
const sitemap = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(sitemap.length, pages.length);
assert.match(read('robots.txt'), /^Allow: \/$/m);
assert.ok(read('robots.txt').includes(`Sitemap: ${origin}/sitemap.xml`));

for (const file of pages) {
  const html = clean(read(file));
  const canonical = `${origin}/${file === 'index.html' ? '' : file.replace(/\.html$/, '')}`;
  assert.match(html, /<html lang="en">/);
  const titleMatches = [...html.matchAll(/<title>(.*?)<\/title>/g)];
  assert.equal(titleMatches.length, 1, `${file}: exactly one title`);
  const title = titleMatches[0][1];
  assert.ok(title.length < 60 && title.includes('Araya Films') && title.includes('Avishek Rayamajhi'));
  assert.ok(!titles.has(title), `${file}: unique title`);
  titles.add(title);
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(match => attributes(match[0]));
  const meta = key => {
    const matches = tags.filter(tag => tag.name === key || tag.property === key);
    assert.equal(matches.length, 1, `${file}: exactly one ${key}`);
    return matches[0].content;
  };
  const description = meta('description');
  assert.ok(description.length < 160 && description.includes('Araya Films') && description.includes('Avishek Rayamajhi'));
  assert.ok(!descriptions.has(description), `${file}: unique description`);
  descriptions.add(description);
  assert.deepEqual(tags.filter(tag => tag.rel === 'canonical').map(tag => tag.href), [canonical]);
  assert.ok(sitemap.includes(canonical), `${file}: listed in sitemap`);
  assert.equal(meta('og:url'), canonical);
  assert.equal(meta('og:title'), title);
  assert.equal(meta('og:description'), description);
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.equal(meta('twitter:title'), title);
  assert.equal(meta('twitter:description'), description);
  assert.equal(meta('twitter:image'), meta('og:image'));
  assert.ok(meta('og:image:alt'));
  assert.ok(!tags.some(tag => /robots|googlebot/i.test(tag.name || '') && /noindex|none|nofollow/i.test(tag.content)));
  assert.ok(!html.includes('G-TODO_MEASUREMENT_ID'), `${file}: GA4 placeholder must stay inactive`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(schemas.length, 1);
  const schema = JSON.parse(schemas[0][1]);
  assert.equal(schema['@context'], 'https://schema.org');
  for (const type of ['Person', 'Organization', 'WebSite', 'WebPage']) {
    assert.equal(schema['@graph'].filter(node => node['@type'] === type).length, 1);
  }
  const person = schema['@graph'].find(node => node['@type'] === 'Person');
  assert.equal(person.name, 'Avishek Rayamajhi');
  assert.deepEqual(person.alternateName, ['Araya Films', 'arayafilms']);
  assert.equal(person.address.addressLocality, 'Kathmandu');
  assert.equal(person.address.addressCountry, 'NP');
  assert.equal(schema['@graph'].find(node => node['@type'] === 'WebPage').url, canonical);
  assert.ok(!schema['@graph'].some(node => node['@type'] === 'VideoObject'));

  // Check local linked files and fragments without making network requests.
  for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*>/g)) {
    const tag = attributes(match[0]);
    if (match[0].startsWith('<img')) assert.ok(tag.alt, `${file}: image needs alt`);
    const value = tag.href || tag.src;
    if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) continue;
    const url = new URL(value, canonical);
    const target = value.startsWith('#') ? file : decodeURIComponent(url.pathname.slice(1)) || 'index.html';
    assert.ok(fs.existsSync(path.join(__dirname, target)), `${file}: missing local target ${target}`);
    if (url.hash && target.endsWith('.html')) {
      const ids = [...clean(read(target)).matchAll(/\bid="([^"]+)"/g)].map(item => item[1]);
      assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing fragment ${value}`);
    }
  }
  assert.ok(fs.existsSync(path.join(__dirname, new URL(meta('og:image')).pathname)));
  console.log(`${file}: PASS (title ${title.length}, description ${description.length}; metadata, JSON-LD, local links)`);
}
console.log('SEO checks passed. External availability, HTTP headers, rendering and rankings need separate verification.');
