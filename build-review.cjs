// Rebuild the review's embedded pages without changing the live portfolio.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const pages = {};
for (const name of ['index.html', 'video.html', 'photo.html', 'about.html', 'contact.html']) {
  pages[name] = read(name)
    .replace(/<link rel="stylesheet" href="([^"]+)"\s*\/>/g, (_, file) => `<style>${read(file)}</style>`)
    .replace(/<script src="([^"]+)"><\/script>/g, (_, file) => `<script>${read(file)}</script>`)
    .replace(/src="(assets\/[^"]+)"/g, (_, file) => {
      const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `src="data:${mime};base64,${fs.readFileSync(path.join(root, file)).toString('base64')}"`;
    });
}
const output = path.join(root, 'portfolio-review.mockup.html');
const embedded = JSON.stringify(pages).replace(/</g, '\\u003c');
fs.writeFileSync(output, read('portfolio-review.mockup.html').replace(
  /(<script id="portfolio-pages" type="application\/json">)[\s\S]*?(<\/script>)/,
  (_, open, close) => open + embedded + close
));
