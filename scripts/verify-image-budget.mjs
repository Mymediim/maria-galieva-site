import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve('prototype-desktop.html'), 'utf8');
const tags = source.match(/<img\b[^>]*>/g) ?? [];
assert.ok(tags.length > 0, 'No images found in prototype-desktop.html');

let totalBytes = (await stat(resolve('assets/maria-social-1200x630.webp'))).size;
for (const tag of tags) {
  const src = tag.match(/\bsrc="assets\/([^"]+)"/)?.[1];
  assert.ok(src, `Image must use a local assets path: ${tag}`);
  assert.match(tag, /\balt="[^"]*"/, `Missing alt: ${src}`);
  assert.match(tag, /\bwidth="\d+"/, `Missing width: ${src}`);
  assert.match(tag, /\bheight="\d+"/, `Missing height: ${src}`);

  const bytes = (await stat(resolve('assets', src))).size;
  totalBytes += bytes;

  if (src.includes('maria-hero')) {
    assert.match(tag, /\bfetchpriority="high"/, 'Hero image must have high fetch priority');
    assert.ok(bytes <= 300 * 1024, `Hero image is too large: ${bytes} bytes`);
  } else {
    assert.match(tag, /\bloading="lazy"/, `Below-the-fold image must be lazy: ${src}`);
  }
}

assert.ok(totalBytes <= 1.5 * 1024 * 1024, `Image budget exceeded: ${totalBytes} bytes`);
console.log(`Image verification passed: ${tags.length} images, ${totalBytes} bytes including social preview.`);
