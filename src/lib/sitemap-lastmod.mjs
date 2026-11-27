import { execFileSync } from 'node:child_process';

// Omit dates when history is unavailable; deployment time is not content lastmod.
export function getContentLastmod(paths, { cwd = process.cwd() } = {}) {
  if (!paths.length) return null;
  const git = (args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    if (git(['rev-parse', '--is-shallow-repository']) === 'true') return null;
    const date = git(['log', '-1', '--format=%cI', '--', ...paths]);
    return /^\d{4}-\d{2}-\d{2}T/.test(date) ? date.slice(0, 10) : null;
  } catch { return null; }
}
