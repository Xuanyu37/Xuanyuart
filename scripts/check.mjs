import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');
const WORKS = path.join(CONTENT, 'works');
const SRC = path.join(ROOT, 'src');
const SCRIPTS = path.join(ROOT, 'scripts');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
};
const named = (dir, name) => walk(dir).filter(file => path.basename(file) === name);

const pkg = readJson(path.join(ROOT, 'package.json'));
const site = readJson(path.join(CONTENT, 'site.json'));
if (pkg.version !== site.version) throw new Error(`Version mismatch: package=${pkg.version}, site=${site.version}`);

if (fs.existsSync(path.join(CONTENT, 'series'))) {
  throw new Error('content/series must not exist. Put series under content/works/YYYY/.');
}

const workFiles = named(WORKS, 'work.json');
const seriesFiles = named(WORKS, 'series.json');
const workData = workFiles.map(file => ({file, data:readJson(file)}));
const seriesData = seriesFiles.map(file => ({file, data:readJson(file)}));

for (const {file, data} of [...workData, ...seriesData]) {
  const rel = path.relative(WORKS, file).replaceAll('\\','/');
  if (!/^\d{4}\//.test(rel)) throw new Error(`Content is outside a year folder: ${rel}`);
  if ('theme' in data || 'themes' in data) throw new Error(`Theme fields are not part of v0.0.2: ${rel}`);
}

// Syntax-check source JavaScript without adding dependencies.
for (const file of [...walk(SRC), ...walk(SCRIPTS)].filter(file => /\.(?:js|mjs)$/.test(file))) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || '');
    throw new Error(`JavaScript syntax check failed: ${path.relative(ROOT,file)}`);
  }
}

const build = spawnSync(process.execPath, ['scripts/build.mjs'], {cwd:ROOT, encoding:'utf8'});
process.stdout.write(build.stdout || '');
process.stderr.write(build.stderr || '');
if (build.status !== 0) process.exit(build.status || 1);

const htmlFiles = walk(DIST).filter(file => file.endsWith('.html'));
const broken = [];

function targetFor(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean || clean === '/' || clean.startsWith('mailto:') || clean.startsWith('tel:') || clean.startsWith('data:') || /^https?:\/\//.test(clean) || clean.startsWith('//')) return null;
  if (!clean.startsWith('/')) return null;
  const rel = clean.slice(1);
  if (!rel) return path.join(DIST,'index.html');
  if (clean.endsWith('/')) return path.join(DIST, rel, 'index.html');
  const ext = path.extname(rel);
  return ext ? path.join(DIST, rel) : path.join(DIST, rel, 'index.html');
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file,'utf8');
  const relFile = path.relative(DIST,file);
  if (!html.includes('name="viewport"')) broken.push(`${relFile}: missing viewport meta`);
  if (!html.includes(`name="version" content="${site.version}"`)) broken.push(`${relFile}: wrong version meta`);
  if (!/<html\s+lang="[^"]+"/.test(html)) broken.push(`${relFile}: missing html lang`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const duplicateIds = ids.filter((id,index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) broken.push(`${relFile}: duplicate id(s): ${[...new Set(duplicateIds)].join(', ')}`);

  for (const m of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)) {
    const target = targetFor(m[1]);
    if (target && !fs.existsSync(target)) broken.push(`${relFile} -> ${m[1]}`);
  }
}

const localePrefix = locale => locale === site.defaultLocale ? '' : `${locale}/`;
for (const locale of site.locales) {
  const suffix = localePrefix(locale);
  for (const route of ['', 'works/', 'about/', 'cv/', 'contact/']) {
    const file = path.join(DIST, suffix, route, 'index.html');
    if (!fs.existsSync(file)) broken.push(`missing route: /${suffix}${route}`);
  }

  for (const {data} of workData.filter(x => x.data.published !== false)) {
    const file = path.join(DIST, suffix, 'works', data.slug, 'index.html');
    if (!fs.existsSync(file)) broken.push(`missing work route: /${suffix}works/${data.slug}/`);
  }
  for (const {data} of seriesData.filter(x => x.data.published !== false)) {
    const file = path.join(DIST, suffix, 'series', data.slug, 'index.html');
    if (!fs.existsSync(file)) broken.push(`missing series route: /${suffix}series/${data.slug}/`);
  }

  const dataFile = path.join(DIST,'assets','data',`works-${locale}.json`);
  if (!fs.existsSync(dataFile)) {
    broken.push(`missing works data: ${path.relative(DIST,dataFile)}`);
    continue;
  }
  const data = readJson(dataFile);
  if (!Array.isArray(data)) {
    broken.push(`${dataFile}: not an array`);
    continue;
  }
  for (const item of data) {
    for (const field of ['href','cover']) {
      const target = targetFor(item[field]);
      if (target && !fs.existsSync(target)) broken.push(`${path.relative(DIST,dataFile)} ${item.slug} -> ${item[field]}`);
    }
  }
}

for (const asset of ['assets/site.css','assets/site.js','assets/home.js','assets/works.js','404.html','robots.txt']) {
  if (!fs.existsSync(path.join(DIST,asset))) broken.push(`missing generated asset: ${asset}`);
}

if (broken.length) {
  console.error('\nIntegrity check failed:');
  for (const issue of broken.slice(0,150)) console.error(`- ${issue}`);
  if (broken.length > 150) console.error(`... and ${broken.length-150} more`);
  process.exit(1);
}

console.log(`Check passed: ${htmlFiles.length} HTML pages, ${site.locales.length} locales, ${workData.length} work file(s), ${seriesData.length} series file(s), no broken local links.`);
