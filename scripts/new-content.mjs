import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [kind, relative] = process.argv.slice(2);

if (!['work', 'series'].includes(kind) || !relative) {
  console.error('Usage:\n  npm run new:work -- 2027/mon-oeuvre\n  npm run new:series -- 2027/mon-projet\n  npm run new:work -- 2027/mon-projet/oeuvre-01');
  process.exit(1);
}

const cleanRelative = relative.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
const parts = cleanRelative.split('/').filter(Boolean);
const archiveYear = Number(parts[0]);
if (!/^\d{4}$/.test(parts[0] || '') || !Number.isInteger(archiveYear)) {
  console.error('The first folder must be a 4-digit year, for example: 2027/mon-oeuvre');
  process.exit(1);
}

const slug = path.basename(cleanRelative)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

if (!slug) {
  console.error('Could not create a valid slug from the folder name.');
  process.exit(1);
}

const base = path.join(ROOT, 'content', 'works');
const dir = path.join(base, cleanRelative);
if (fs.existsSync(dir)) {
  console.error(`Already exists: ${dir}`);
  process.exit(1);
}

function findParentSeries(startDir) {
  let current = startDir;
  while (current.startsWith(base) && current !== base) {
    const candidate = path.join(current, 'series.json');
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf8')).slug || null;
      } catch {
        return null;
      }
    }
    current = path.dirname(current);
  }
  return null;
}

fs.mkdirSync(dir, {recursive:true});

const parentSeries = kind === 'work' ? findParentSeries(path.dirname(dir)) : null;
const data = kind === 'work' ? {
  type: 'work',
  slug,
  title: 'Titre de l’œuvre',
  year: archiveYear,
  medium: ['painting'],
  series: parentSeries,
  aspect: 'landscape',
  cover: 'cover.webp',
  images: ['cover.webp'],
  published: false,
  showInWorks: true,
  dimensions: '',
  duration: null,
  description: {fr:'', en:'', zh:''}
} : {
  type: 'series',
  slug,
  title: 'Titre de la série',
  years: [archiveYear],
  mediums: ['photography'],
  aspect: 'landscape',
  cover: '01.webp',
  images: [{src:'01.webp', caption:'01'}],
  published: false,
  showInWorks: true,
  description: {fr:'', en:'', zh:''}
};

const filename = kind === 'work' ? 'work.json' : 'series.json';
fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2) + '\n');
console.log(`Created ${path.relative(ROOT, path.join(dir, filename))}`);
if (parentSeries) console.log(`Series automatically set to: ${parentSeries}`);
console.log('Add media files, edit metadata, then set published=true.');
