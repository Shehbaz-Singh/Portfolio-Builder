// Checks that the visitor's reading preferences stay where they belong:
//  1. every rule of app/reading-prefs.css is inside one @media screen block, so printing (and
//     "save as PDF") ignores them;
//  2. the resume PDF code never reads them (it is drawn by @react-pdf, not by the page's CSS);
//  3. the dashboard never imports them.
/* global console, process, URL */
// Run with: npm run check:reading-prefs -w @parichay/frontend
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');
const problems = [];

// 1. The stylesheet.
const css = readFileSync(join(src, 'app', 'reading-prefs.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .trim();
let depth = 0;
let closedAt = -1;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') depth++;
  if (css[i] === '}' && --depth === 0 && closedAt === -1) closedAt = i;
}
if (!css.startsWith('@media screen'))
  problems.push('reading-prefs.css must start with @media screen');
if (closedAt !== css.length - 1)
  problems.push('reading-prefs.css has rules outside its @media screen block');
if (depth !== 0) problems.push('reading-prefs.css has unbalanced braces');

// No other stylesheet may set the same attributes (it would not be scoped to screen).
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = walk(src);
for (const file of files.filter((f) => f.endsWith('.css') && !f.endsWith('reading-prefs.css'))) {
  if (/data-read-/.test(readFileSync(file, 'utf8')))
    problems.push(`${relative(root, file)} styles data-read-*`);
}

// 2 and 3. Who may mention the preferences.
const mentions = /reading-prefs|ReadingPreferences|data-read-|data-reading/;
const resume = files.filter((f) => /resume/i.test(relative(src, f)) && /\.(ts|tsx)$/.test(f));
for (const file of resume) {
  if (mentions.test(readFileSync(file, 'utf8')))
    problems.push(`${relative(root, file)} reads reading preferences`);
}
const dashboard = files.filter(
  (f) => relative(src, f).split(sep).includes('dashboard') && /\.(ts|tsx)$/.test(f),
);
for (const file of dashboard) {
  if (mentions.test(readFileSync(file, 'utf8')))
    problems.push(`${relative(root, file)} reads reading preferences`);
}

if (resume.length === 0) problems.push('found no resume files to check');
if (problems.length > 0) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log(
  `ok: stylesheet is screen-only, ${resume.length} resume files and ${dashboard.length} dashboard files do not use the preferences`,
);
