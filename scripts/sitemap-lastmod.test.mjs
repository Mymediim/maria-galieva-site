import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { getContentLastmod } from '../src/lib/sitemap-lastmod.mjs';

test('lastmod follows page content, not unrelated commits or build time', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'sitemap-history-'));
  const git = (args, date) => execFileSync('git', args, {
    cwd, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
  try {
    git(['init'], '2026-09-01T12:00:00Z');
    git(['config', 'user.name', 'Test']);
    git(['config', 'user.email', 'test@example.com']);
    writeFileSync(join(cwd, 'page.html'), 'Page');
    git(['add', '.']);
    git(['commit', '-m', 'Content'], '2026-09-01T12:00:00Z');
    writeFileSync(join(cwd, 'unrelated.txt'), 'Unrelated');
    git(['add', '.']);
    git(['commit', '-m', 'Unrelated'], '2026-10-02T12:00:00Z');
    assert.equal(getContentLastmod(['page.html'], { cwd }), '2026-09-01');
    assert.equal(getContentLastmod(['missing.html'], { cwd }), null);
    assert.equal(getContentLastmod([], { cwd }), null);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test('missing repository omits lastmod rather than inventing a date', () => {
  assert.equal(getContentLastmod(['page.html'], { cwd: tmpdir() }), null);
});
