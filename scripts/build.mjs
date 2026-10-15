import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const WORKS_CONTENT = path.join(CONTENT, 'works');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const site = readJson(path.join(CONTENT, 'site.json'));
const homeConfig = readJson(path.join(CONTENT, 'pages', 'home.json'));
const about = readJson(path.join(CONTENT, 'pages', 'about.json'));
const cv = readJson(path.join(CONTENT, 'pages', 'cv.json'));
const contact = readJson(path.join(CONTENT, 'pages', 'contact.json'));
const locales = site.locales;
const defaultLocale = site.defaultLocale;

const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const localize = (value, locale) => value && typeof value === 'object' && !Array.isArray(value) ? (value[locale] ?? value[defaultLocale] ?? '') : (value ?? '');
const unique = arr => [...new Set(arr)];
const ensureArray = v => v == null ? [] : Array.isArray(v) ? v : [v];

function findNamedFiles(dir, filename) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findNamedFiles(full, filename));
    else if (entry.isFile() && entry.name === filename) out.push(full);
  }
  return out;
}

function validateSlug(slug, source) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid or missing slug in ${source}: ${slug}`);
}

function mediaUrl(kind, slug, rel) {
  if (!rel) return '';
  if (/^(https?:)?\/\//.test(rel) || rel.startsWith('/')) return rel;
  return `/media/${kind}/${slug}/${rel.replaceAll('\\','/')}`;
}

function safeLocalMediaRel(rel, item) {
  const normalized = path.posix.normalize(String(rel).replaceAll('\\','/'));
  if (normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe media path for ${item.kind} ${item.slug}: ${rel}`);
  }
  return normalized;
}

function referencedMedia(item) {
  const refs = new Set();
  const add = rel => {
    if (!rel || /^(https?:)?\/\//.test(rel) || rel.startsWith('/')) return;
    refs.add(safeLocalMediaRel(rel, item));
  };
  add(item.cover);
  for (const img of ensureArray(item.images)) add(typeof img === 'string' ? img : img?.src);
  add(item.video);
  add(item.audio);
  add(item.poster);
  return [...refs];
}

function copyReferencedMedia(item, destDir) {
  fs.mkdirSync(destDir, {recursive:true});
  for (const rel of referencedMedia(item)) {
    const src = path.join(item.sourceDir, rel);
    const dst = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(dst), {recursive:true});
    fs.copyFileSync(src, dst);
  }
}

function sourceRelative(file) {
  return path.relative(WORKS_CONTENT, file).replaceAll('\\','/');
}

function validateArchivePath(file) {
  const rel = sourceRelative(file);
  const first = rel.split('/')[0];
  if (!/^\d{4}$/.test(first) || Number(first) < 1000) {
    throw new Error(`Content must live under content/works/YYYY/: ${rel}`);
  }
  return Number(first);
}

function validateMediumKeys(keys, source) {
  for (const key of keys) {
    if (!site.mediums[key]) throw new Error(`Unknown medium "${key}" in ${source}. Add it to content/site.json > mediums first.`);
  }
}

function loadWorks() {
  const seen = new Set();
  return findNamedFiles(WORKS_CONTENT, 'work.json').map(file => {
    const raw = readJson(file);
    validateArchivePath(file);
    validateSlug(raw.slug, file);
    if (seen.has(raw.slug)) throw new Error(`Duplicate work slug: ${raw.slug}`);
    seen.add(raw.slug);
    if (!raw.title || !raw.year || !raw.medium || !raw.cover) throw new Error(`Work is missing title/year/medium/cover: ${file}`);
    const year = Number(raw.year);
    if (!Number.isInteger(year) || year < 1000 || year > 9999) throw new Error(`Invalid work year in ${file}: ${raw.year}`);
    const mediums = ensureArray(raw.medium).filter(Boolean);
    if (!mediums.length) throw new Error(`Work is missing medium: ${file}`);
    validateMediumKeys(mediums, file);
    const item = {
      ...raw,
      kind:'work',
      sourceDir:path.dirname(file),
      years:[year],
      mediums,
      seriesList:raw.series ? [raw.series] : [],
      sortYear:year,
      published:raw.published !== false,
      showInWorks:raw.showInWorks !== false
    };
    return item;
  });
}

function loadSeries() {
  const seen = new Set();
  return findNamedFiles(WORKS_CONTENT, 'series.json').map(file => {
    const raw = readJson(file);
    validateArchivePath(file);
    validateSlug(raw.slug, file);
    if (seen.has(raw.slug)) throw new Error(`Duplicate series slug: ${raw.slug}`);
    seen.add(raw.slug);
    if (!raw.title || !raw.cover) throw new Error(`Series is missing title/cover: ${file}`);
    const years = ensureArray(raw.years).map(Number).filter(Number.isFinite);
    if (!years.length) throw new Error(`Series is missing years: ${file}`);
    if (years.some(y => !Number.isInteger(y) || y < 1000 || y > 9999)) throw new Error(`Invalid series year in ${file}: ${raw.years}`);
    const mediums = ensureArray(raw.mediums ?? raw.medium).filter(Boolean);
    if (!mediums.length) throw new Error(`Series is missing mediums: ${file}`);
    validateMediumKeys(mediums, file);
    return {
      ...raw,
      kind:'series',
      sourceDir:path.dirname(file),
      years,
      mediums,
      seriesList:[raw.slug],
      sortYear:Math.max(...years),
      published:raw.published !== false,
      showInWorks:raw.showInWorks !== false
    };
  });
}

const works = loadWorks().filter(x => x.published);
const series = loadSeries().filter(x => x.published);

function validateLocalMedia(item, rel, label) {
  if (!rel || /^(https?:)?\/\//.test(rel) || rel.startsWith('/')) return;
  const safeRel = safeLocalMediaRel(rel, item);
  const file = path.join(item.sourceDir, safeRel);
  if (!fs.existsSync(file)) throw new Error(`Missing ${label} for ${item.kind} ${item.slug}: ${rel}`);
}
for (const work of works) {
  validateLocalMedia(work, work.cover, 'cover');
  for (const img of ensureArray(work.images)) validateLocalMedia(work, typeof img === 'string' ? img : img?.src, 'image');
  validateLocalMedia(work, work.video, 'video');
  validateLocalMedia(work, work.audio, 'audio');
  validateLocalMedia(work, work.poster, 'poster');
}
for (const s of series) {
  validateLocalMedia(s, s.cover, 'cover');
  for (const img of ensureArray(s.images)) validateLocalMedia(s, typeof img === 'string' ? img : img?.src, 'image');
}

const workMap = new Map(works.map(x => [x.slug,x]));
const seriesMap = new Map(series.map(x => [x.slug,x]));

for (const work of works) {
  if (work.series && !seriesMap.has(work.series)) console.warn(`Warning: work ${work.slug} references unknown series ${work.series}`);
}

function prefix(locale) { return locale === defaultLocale ? '' : `/${locale}`; }
function route(locale, routePath='') {
  const clean = String(routePath).replace(/^\/+|\/+$/g,'');
  const base = prefix(locale);
  if (!clean) return base ? `${base}/` : '/';
  return `${base}/${clean}/`.replace(/\/+/g,'/');
}
function outputFile(locale, routePath='') {
  const url = route(locale, routePath);
  const clean = url.replace(/^\/+|\/+$/g,'');
  return clean ? path.join(DIST, clean, 'index.html') : path.join(DIST, 'index.html');
}
function writePage(locale, routePath, html) {
  const file = outputFile(locale, routePath);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, html);
}
function workRoute(locale, slug) { return route(locale, `works/${slug}`); }
function seriesRoute(locale, slug) { return route(locale, `series/${slug}`); }
function yearLabel(years) {
  const ys = [...years].sort((a,b)=>a-b);
  if (ys.length === 1) return String(ys[0]);
  return `${ys[0]}–${ys.at(-1)}`;
}
function mediumLabel(key, locale) { return site.mediums[key]?.[locale] ?? key; }
function themeButton(locale, cls='theme-toggle') {
  const t = site.i18n[locale];
  return `<button class="${cls}" data-theme-toggle data-dark-label="${esc(t.dark)}" data-light-label="${esc(t.light)}">${esc(t.dark)}</button>`;
}
function languageLinks(locale, routePath) {
  const labels = {fr:'FR',en:'EN',zh:'中文'};
  return locales.map(l => `<a href="${route(l,routePath)}" class="${l===locale?'active':''}" hreflang="${l==='zh'?'zh-CN':l}">${labels[l]}</a>`).join('<span>/</span>');
}
function navigation(locale, active, routePath) {
  const t = site.i18n[locale];
  const items = [
    ['home',t.home,route(locale)],
    ['works',t.works,route(locale,'works')],
    ['cv',t.cv,route(locale,'cv')],
    ['about',t.about,route(locale,'about')],
    ['contact',t.contact,route(locale,'contact')]
  ];
  const nav = items.map(([key,label,href]) => `<a href="${href}" class="${key===active?'active':''}">${esc(label)}</a>`).join('');
  const langs = languageLinks(locale,routePath);
  const navigationLabel = t.navigation || 'Navigation';
  return {
    desktop:`<nav class="desktop-nav" aria-label="${esc(navigationLabel)}">${nav}<div class="lang-switch">${langs}</div>${themeButton(locale)}</nav>`,
    drawer:`<div class="drawer-layer" data-drawer-layer aria-hidden="true"><div class="drawer-backdrop" data-drawer-backdrop></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(navigationLabel)}"><button class="drawer-close" data-drawer-close>${esc(t.close)}</button><nav class="drawer-nav" aria-label="${esc(navigationLabel)}">${nav}</nav><div class="drawer-lang">${langs}</div>${themeButton(locale,'drawer-theme')}</aside></div>`
  };
}
function lightbox(locale) {
  const t = site.i18n[locale];
  return `<div class="lightbox" data-lightbox-root aria-hidden="true" role="dialog" aria-modal="true" aria-label="${esc(t.imageViewer || 'Image viewer')}"><div class="lightbox-top"><button data-lightbox-close>${esc(t.close)}</button></div><div class="lightbox-stage" data-lightbox-stage><button class="lightbox-nav prev" data-lightbox-prev aria-label="${esc(t.previous || 'Previous')}">←</button><div class="lightbox-image" data-lightbox-image><img alt=""></div><button class="lightbox-nav next" data-lightbox-next aria-label="${esc(t.next || 'Next')}">→</button></div></div>`;
}
function layout({locale,active,routePath,title,description='',body,scripts=[]}) {
  const nav = navigation(locale,active,routePath);
  const t = site.i18n[locale];
  const langAttr = locale === 'zh' ? 'zh-CN' : locale;
  return `<!doctype html>
<html lang="${langAttr}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="color-scheme" content="light dark">
  <meta name="version" content="${esc(site.version)}">
  <meta name="description" content="${esc(description)}">
  <title>${esc(title)}</title>
  <script>try{const t=localStorage.getItem('sanqi-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}</script>
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body>
  <header class="site-header"><a class="brand" href="${route(locale)}">${esc(site.name)}</a>${nav.desktop}<button class="mobile-menu-btn" data-drawer-open aria-label="${esc(t.menu || 'Menu')}" aria-expanded="false">☰</button></header>
  <main>${body}</main>
  <footer class="site-footer">© ${new Date().getFullYear()} ${esc(site.name)}</footer>
  ${nav.drawer}
  ${lightbox(locale)}
  <script src="/assets/site.js" defer></script>
  ${scripts.map(s=>`<script src="${s}" defer></script>`).join('\n  ')}
</body>
</html>`;
}

function itemCover(item) { return mediaUrl(item.kind==='work'?'works':'series', item.slug, item.cover); }
function itemHref(item, locale) { return item.kind === 'work' ? workRoute(locale,item.slug) : seriesRoute(locale,item.slug); }
function itemSecondary(item, locale) {
  const y = yearLabel(item.years);
  if (item.kind === 'series') return `${y} · ${site.i18n[locale].series}`;
  return `${y} · ${item.mediums.map(m=>mediumLabel(m,locale)).join(' / ')}`;
}
function itemFromRef(ref) {
  if (typeof ref !== 'string' || !ref.includes(':')) throw new Error(`Invalid home reference: ${ref}`);
  const [kind,slug] = ref.split(':');
  if (!['work','series'].includes(kind)) throw new Error(`Invalid home reference kind: ${ref}`);
  const item = kind === 'work' ? workMap.get(slug) : seriesMap.get(slug);
  if (!item) throw new Error(`Unknown or unpublished home reference: ${ref}`);
  return item;
}

function renderHome(locale) {
  const featureRefs = ensureArray(homeConfig.feature).filter(Boolean);
  const secondaryRefs = ensureArray(homeConfig.secondary).filter(Boolean);
  const feature = featureRefs.map(itemFromRef);
  const secondary = secondaryRefs.map(itemFromRef);

  const slides = feature.map((item,i)=>`<a class="slide ${i===0?'active':''}" data-slide href="${itemHref(item,locale)}" data-title="${esc(`${item.title}, ${yearLabel(item.years)}`)}"><img src="${itemCover(item)}" alt="${esc(item.title)}" ${i===0?'fetchpriority="high"':'loading="lazy" decoding="async"'}></a>`).join('');
  const cards = secondary.map(item=>`<a class="home-card" href="${itemHref(item,locale)}"><div class="home-card-media"><img src="${itemCover(item)}" alt="${esc(item.title)}" loading="lazy" decoding="async"></div><div class="home-card-meta">${esc(item.title)}, ${esc(yearLabel(item.years))}</div></a>`).join('');

  let featureHTML = '';
  if (feature.length) {
    const first = feature[0];
    const controls = feature.length > 1
      ? `<button class="feature-control prev" data-carousel-prev aria-label="${esc(site.i18n[locale].previous || 'Previous')}">←</button><button class="feature-control next" data-carousel-next aria-label="${esc(site.i18n[locale].next || 'Next')}">→</button>`
      : '';
    featureHTML = `<div class="feature" data-carousel tabindex="0"><div class="feature-stage">${slides}${controls}</div><div class="feature-meta"><a class="feature-title" data-carousel-title href="${itemHref(first,locale)}">${esc(first.title)}, ${yearLabel(first.years)}</a><div class="feature-count" data-carousel-count>01 / ${String(feature.length).padStart(2,'0')}</div></div></div>`;
  }

  const secondaryHTML = cards ? `<div class="home-secondary">${cards}</div>` : '';
  const body = `<section class="page home-page">${featureHTML}${secondaryHTML}</section>`;
  const scripts = feature.length > 1 ? ['/assets/home.js'] : [];
  return layout({locale,active:'home',routePath:'',title:site.name,body,scripts});
}

function worksIndexItems(locale) {
  const items = [...works.filter(x=>x.showInWorks), ...series.filter(x=>x.showInWorks)].sort((a,b)=>b.sortYear-a.sortYear || a.title.localeCompare(b.title));
  return items.map(item => ({
    kind:item.kind,slug:item.slug,title:item.title,years:item.years,mediums:item.mediums,series:item.seriesList,
    aspect:item.aspect||'landscape',cover:itemCover(item),href:itemHref(item,locale),secondary:itemSecondary(item,locale),alt:item.title
  }));
}
function countText(n,locale) {
  if (locale === 'zh') return `${n} 件作品`;
  const t=site.i18n[locale]; return `${n} ${n===1?t.workSingular:t.workPlural}`;
}
function filterRow({label,key,options,all,optionLabel,moreLabel='More'}) {
  const buttons = [`<button class="active" data-value="all">${esc(all)}</button>`, ...options.map(v=>`<button data-value="${esc(v)}">${esc(optionLabel(v))}</button>`)].join('');
  return `<div class="filter-group" data-filter-row="${key}"><div class="filter-label">${esc(label)}</div><div class="filter-options-shell"><div class="filter-options" data-filter-group="${key}">${buttons}</div><button class="filter-more" type="button" aria-expanded="false" aria-label="${esc(moreLabel)}">＋</button></div></div>`;
}
function serverCard(item) {
  return `<a class="work-card aspect-${esc(item.aspect)}" href="${item.href}" data-work-card><div class="work-thumb"><img src="${item.cover}" alt="${esc(item.alt)}" loading="lazy" decoding="async"></div><div class="work-meta"><span>${esc(item.title)}</span><span class="work-secondary">${esc(item.secondary)}</span></div></a>`;
}
function renderWorks(locale) {
  const t=site.i18n[locale];
  const items = worksIndexItems(locale);
  const years=unique(items.flatMap(x=>x.years)).sort((a,b)=>b-a).map(String);
  const usedMediums=new Set(items.flatMap(x=>x.mediums));
  const mediums=Object.keys(site.mediums).filter(key=>usedMediums.has(key));
  const usedSeries=unique(items.flatMap(x=>x.series));
  const moreLabel=t.more || 'More';
  const rows = [
    filterRow({label:t.year,key:'year',options:years,all:t.all,optionLabel:v=>v,moreLabel}),
    filterRow({label:t.medium,key:'medium',options:mediums,all:t.all,optionLabel:v=>mediumLabel(v,locale),moreLabel}),
    filterRow({label:t.series,key:'series',options:usedSeries,all:t.all,optionLabel:v=>seriesMap.get(v)?.title ?? v,moreLabel})
  ].join('');
  const initial=items.slice(0,48).map(serverCard).join('');
  const dataFile=`/assets/data/works-${locale}.json`;
  const body=`<section class="page works-page" data-works-page data-works-url="${dataFile}" data-batch-size="48" data-count-singular="${esc(t.workSingular)}" data-count-plural="${esc(t.workPlural)}"><h1 class="page-title">${esc(t.works)}</h1><div class="works-toolbar"><div class="subtle" data-works-count>${esc(countText(items.length,locale))}</div></div>${items.length?`<div class="filter-groups">${rows}</div>`:''}<div class="works-grid" data-works-grid>${initial}</div><div class="works-empty" data-works-empty>${esc(t.noResults)}</div><div class="works-sentinel" data-works-sentinel></div><div class="works-loading" aria-hidden="true"></div></section>`;
  return layout({locale,active:'works',routePath:'works',title:`${t.works} — ${site.name}`,body,scripts:['/assets/works.js']});
}

function imageArray(work) {
  const imgs=ensureArray(work.images?.length?work.images:[work.cover]);
  return imgs.map(x=>typeof x==='string'?{src:x,caption:''}:x);
}
function renderWork(work,locale) {
  const t=site.i18n[locale];
  const mediaRoot='works';
  const gallery=imageArray(work);
  const imageHTML=gallery.map((img,i)=>{
    const alt=localize(img.alt,locale) || work.title;
    const caption=localize(img.caption,locale);
    return `<div class="detail-image-item"><button class="art-image-button" data-lightbox data-lightbox-group="work-${esc(work.slug)}" data-lightbox-src="${mediaUrl(mediaRoot,work.slug,img.src)}" data-lightbox-alt="${esc(alt)}"><span class="art-image"><img src="${mediaUrl(mediaRoot,work.slug,img.src)}" alt="${esc(alt)}" ${i===0?'fetchpriority="high"':'loading="lazy" decoding="async"'}></span></button>${caption?`<div class="detail-image-caption">${esc(caption)}</div>`:''}</div>`;
  }).join('');
  const video=work.video?`<video class="video-player" controls preload="metadata" ${work.poster?`poster="${mediaUrl(mediaRoot,work.slug,work.poster)}"`:''}><source src="${mediaUrl(mediaRoot,work.slug,work.video)}"></video>`:'';
  const audio=work.audio?`<audio class="audio-player" controls preload="metadata" src="${mediaUrl(mediaRoot,work.slug,work.audio)}"></audio>`:'';
  const desc=localize(work.description,locale);
  const dimensions=localize(work.dimensions,locale);
  const seriesLink=work.series&&seriesMap.has(work.series)?`<a class="detail-series-link" href="${seriesRoute(locale,work.series)}">${esc(seriesMap.get(work.series).title)} →</a>`:'';
  const body=`<section class="page"><a class="detail-back" href="${route(locale,'works')}">${esc(t.backWorks)}</a><div class="detail-grid"><div class="detail-media">${video}${imageHTML}${audio}</div><div class="detail-info"><h1>${esc(work.title)}, ${work.year}</h1><p>${esc(work.mediums.map(m=>mediumLabel(m,locale)).join(' / '))}</p>${dimensions?`<p>${esc(dimensions)}</p>`:''}${work.duration?`<p>${esc(work.duration)}</p>`:''}${desc?`<p class="detail-description">${esc(desc)}</p>`:''}${seriesLink}</div></div></section>`;
  return layout({locale,active:'works',routePath:`works/${work.slug}`,title:`${work.title} — ${site.name}`,description:desc,body});
}

function renderSeries(s,locale) {
  const t=site.i18n[locale];
  const desc=localize(s.description,locale);
  const imgs=ensureArray(s.images?.length?s.images:[s.cover]);
  const gallery=imgs.map((img,i)=>{const x=typeof img==='string'?{src:img,caption:'',alt:''}:img;const pattern=(i%6)+1;const caption=localize(x.caption,locale);const alt=localize(x.alt,locale)||s.title;return `<div class="series-item pattern-${pattern}"><button class="art-image-button" data-lightbox data-lightbox-group="series-${esc(s.slug)}" data-lightbox-src="${mediaUrl('series',s.slug,x.src)}" data-lightbox-alt="${esc(alt)}"><span class="series-image"><img src="${mediaUrl('series',s.slug,x.src)}" alt="${esc(alt)}" ${i===0?'fetchpriority="high"':'loading="lazy" decoding="async"'}></span></button>${caption?`<div class="series-caption">${esc(caption)}</div>`:''}</div>`}).join('');
  const body=`<section class="page"><a class="detail-back" href="${route(locale,'works')}">${esc(t.backWorks)}</a><div class="series-head"><h1>${esc(s.title)}</h1><p>${esc(yearLabel(s.years))} · ${esc(s.mediums.map(m=>mediumLabel(m,locale)).join(' / '))}</p>${desc?`<p class="series-copy">${esc(desc)}</p>`:''}</div><div class="series-gallery">${gallery}</div></section>`;
  return layout({locale,active:'works',routePath:`series/${s.slug}`,title:`${s.title} — ${site.name}`,description:desc,body});
}

function renderAbout(locale) {
  const t=site.i18n[locale];
  const bio=localize(about.biography,locale), statement=localize(about.statement,locale);
  const photo=about.photo?`<div class="about-image-wrap"><div class="about-image ${about.orientation==='landscape'?'landscape':''}"><img src="${esc(about.photo)}" alt="${esc(localize(about.photoAlt,locale))}" loading="lazy" decoding="async"></div></div>`:'';
  const bioSection=bio?`<section><h2>${esc(t.biography)}</h2><p>${esc(bio)}</p></section>`:'';
  const statementSection=statement?`<section><h2>${esc(t.statement)}</h2><p>${esc(statement)}</p></section>`:'';
  const body=`<section class="page"><h1 class="page-title">${esc(t.about)}</h1><div class="text-page about-grid ${photo?'':'no-photo'}">${photo}<div class="about-copy">${bioSection}${statementSection}</div></div></section>`;
  return layout({locale,active:'about',routePath:'about',title:`${t.about} — ${site.name}`,description:bio,body});
}
function renderCv(locale) {
  const t=site.i18n[locale];
  const sections=ensureArray(cv.sections).map(sec=>`<div class="cv-section"><h2>${esc(localize(sec.title,locale))}</h2><div class="cv-list">${ensureArray(sec.entries).map(e=>`<div class="cv-row"><span>${esc(e.year)}</span><span>${esc(localize(e.text,locale))}</span></div>`).join('')}</div></div>`).join('');
  const pdf=cv.pdf?`<a class="pdf-link" href="${esc(cv.pdf)}" download>PDF ↓</a>`:'';
  const body=`<section class="page"><div class="cv-head"><h1>CV</h1>${pdf}</div>${sections}</section>`;
  return layout({locale,active:'cv',routePath:'cv',title:`CV — ${site.name}`,body});
}
function renderContact(locale) {
  const t=site.i18n[locale];
  const intro=localize(contact.intro,locale);
  const email=site.email?`<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`:'';
  const ig=site.instagram&&site.instagram!=='#'?`<a href="${esc(site.instagram)}" target="_blank" rel="noreferrer">Instagram ↗</a>`:'';
  const contactList=(email||ig)?`<div class="contact-list">${email}${ig}</div>`:'';
  const body=`<section class="page"><h1 class="page-title">${esc(t.contact)}</h1><div class="text-page">${intro?`<p>${esc(intro)}</p>`:''}${contactList}</div></section>`;
  return layout({locale,active:'contact',routePath:'contact',title:`${t.contact} — ${site.name}`,body});
}

// Build
fs.rmSync(DIST,{recursive:true,force:true});
fs.mkdirSync(DIST,{recursive:true});
fs.cpSync(path.join(SRC,'assets'),path.join(DIST,'assets'),{recursive:true});
if (fs.existsSync(PUBLIC)) fs.cpSync(PUBLIC,DIST,{recursive:true});
fs.mkdirSync(path.join(DIST,'assets','data'),{recursive:true});

for (const work of works) copyReferencedMedia(work,path.join(DIST,'media','works',work.slug));
for (const s of series) copyReferencedMedia(s,path.join(DIST,'media','series',s.slug));

for (const locale of locales) {
  const data=worksIndexItems(locale);
  fs.writeFileSync(path.join(DIST,'assets','data',`works-${locale}.json`),JSON.stringify(data));
  writePage(locale,'',renderHome(locale));
  writePage(locale,'works',renderWorks(locale));
  writePage(locale,'about',renderAbout(locale));
  writePage(locale,'cv',renderCv(locale));
  writePage(locale,'contact',renderContact(locale));
  for (const work of works) writePage(locale,`works/${work.slug}`,renderWork(work,locale));
  for (const s of series) writePage(locale,`series/${s.slug}`,renderSeries(s,locale));
}

const allUrls=[];
for(const locale of locales){
  allUrls.push(route(locale),route(locale,'works'),route(locale,'about'),route(locale,'cv'),route(locale,'contact'));
  for(const w of works) allUrls.push(workRoute(locale,w.slug));
  for(const s of series) allUrls.push(seriesRoute(locale,s.slug));
}
fs.writeFileSync(path.join(DIST,'sitemap-paths.txt'),allUrls.join('\n')+'\n');
fs.writeFileSync(path.join(DIST,'robots.txt'),'User-agent: *\nAllow: /\n');
fs.writeFileSync(path.join(DIST,'404.html'),layout({locale:defaultLocale,active:'',routePath:'',title:`404 — ${site.name}`,body:`<section class="page"><h1 class="page-title">404</h1><p><a href="/">← ${esc(site.i18n[defaultLocale].home)}</a></p></section>`}));
console.log(`Built SANQI ${site.version}: ${works.length} works, ${series.length} series, ${locales.length} locales → dist/`);
