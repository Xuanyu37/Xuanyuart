(async () => {
  const page = document.querySelector('[data-works-page]');
  if (!page) return;

  const url = page.dataset.worksUrl;
  const grid = page.querySelector('[data-works-grid]');
  const count = page.querySelector('[data-works-count]');
  const empty = page.querySelector('[data-works-empty]');
  const sentinel = page.querySelector('[data-works-sentinel]');
  const filterGroups = [...page.querySelectorAll('[data-filter-group]')];
  const batchSize = Math.max(1, Number(page.dataset.batchSize || 48));
  const stateKey = `sanqi:works:${location.pathname}`;

  let items = [];
  let filtered = [];
  let visibleCount = batchSize;
  let restoreScrollY = null;
  let observer = null;

  const state = { year: null, medium: null, series: null };

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  const cardHTML = item => `
    <a class="work-card aspect-${esc(item.aspect || 'landscape')}" href="${esc(item.href)}" data-work-card>
      <div class="work-thumb"><img src="${esc(item.cover)}" alt="${esc(item.alt || '')}" loading="lazy" decoding="async"></div>
      <div class="work-meta"><span>${esc(item.title)}</span><span class="work-secondary">${esc(item.secondary)}</span></div>
    </a>`;

  const countText = n => {
    if (document.documentElement.lang.startsWith('zh')) return `${n} 件作品`;
    const singular = page.dataset.countSingular;
    const plural = page.dataset.countPlural;
    return `${n} ${n === 1 ? singular : plural}`;
  };

  const matches = item => {
    const year = !state.year || item.years.map(String).includes(String(state.year));
    const medium = !state.medium || item.mediums.includes(state.medium);
    const series = !state.series || item.series.includes(state.series);
    return year && medium && series;
  };

  const availableValues = key => {
    if (key === 'year') return new Set(items.flatMap(item => item.years.map(String)));
    if (key === 'medium') return new Set(items.flatMap(item => item.mediums));
    if (key === 'series') return new Set(items.flatMap(item => item.series));
    return new Set();
  };

  const sanitizeRestoredState = () => {
    let changed = false;
    for (const key of Object.keys(state)) {
      if (state[key] && !availableValues(key).has(String(state[key]))) {
        state[key] = null;
        changed = true;
      }
    }
    if (changed) visibleCount = batchSize;
  };

  const updateButtons = () => {
    filterGroups.forEach(group => {
      const key = group.dataset.filterGroup;
      group.querySelectorAll('button[data-value]').forEach(btn => {
        const value = btn.dataset.value;
        btn.classList.toggle('active', value === 'all' ? !state[key] : state[key] === value);
      });
    });
  };

  const updateMeta = () => {
    count.textContent = countText(filtered.length);
    empty.classList.toggle('show', filtered.length === 0);
    sentinel.hidden = visibleCount >= filtered.length || filtered.length === 0;
    updateButtons();
    requestAnimationFrame(updateOverflow);
  };

  const replaceCards = targetCount => {
    visibleCount = Math.min(Math.max(batchSize, targetCount), Math.max(batchSize, filtered.length));
    const visible = filtered.slice(0, visibleCount);
    grid.innerHTML = visible.map(cardHTML).join('');
    visibleCount = visible.length;
    updateMeta();
  };

  const applyFilters = ({ resetVisible = false } = {}) => {
    filtered = items.filter(matches);
    const target = resetVisible ? batchSize : Math.max(batchSize, visibleCount);
    replaceCards(target);
  };

  const loadMore = () => {
    if (visibleCount >= filtered.length) return;
    const nextCount = Math.min(visibleCount + batchSize, filtered.length);
    const nextItems = filtered.slice(visibleCount, nextCount);
    grid.insertAdjacentHTML('beforeend', nextItems.map(cardHTML).join(''));
    visibleCount = nextCount;
    updateMeta();
  };

  const updateOverflow = () => {
    page.querySelectorAll('[data-filter-row]').forEach(row => {
      const options = row.querySelector('.filter-options');
      const more = row.querySelector('.filter-more');
      if (!options || !more) return;

      if (row.classList.contains('expanded')) {
        options.style.maxHeight = 'none';
      } else {
        options.style.maxHeight = '24px';
      }

      const hasOverflow = row.classList.contains('expanded')
        ? options.scrollHeight > 28
        : options.scrollHeight > options.clientHeight + 1;

      row.classList.toggle('has-overflow', hasOverflow);
      if (!hasOverflow) {
        row.classList.remove('expanded');
        more.setAttribute('aria-expanded', 'false');
        options.style.maxHeight = '24px';
      }
    });
  };

  page.querySelectorAll('.filter-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('[data-filter-row]');
      const options = row?.querySelector('.filter-options');
      if (!row || !options) return;

      const expanded = !row.classList.contains('expanded');
      row.classList.toggle('expanded', expanded);
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      options.style.maxHeight = expanded ? 'none' : '24px';
    });
  });

  filterGroups.forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('button[data-value]');
      if (!btn) return;
      const key = group.dataset.filterGroup;
      const value = btn.dataset.value;
      state[key] = value === 'all' ? null : (state[key] === value ? null : value);
      applyFilters({ resetVisible: true });
    });
  });

  const saveState = () => {
    try {
      sessionStorage.setItem(stateKey, JSON.stringify({
        filters: state,
        visibleCount,
        scrollY: window.scrollY
      }));
    } catch {}
  };

  window.addEventListener('pagehide', saveState);
  grid.addEventListener('click', e => {
    if (e.target.closest('[data-work-card]')) saveState();
  });

  try {
    const saved = JSON.parse(sessionStorage.getItem(stateKey) || 'null');
    if (saved?.filters) Object.assign(state, saved.filters);
    if (Number.isFinite(Number(saved?.visibleCount))) visibleCount = Math.max(batchSize, Number(saved.visibleCount));
    if (Number.isFinite(Number(saved?.scrollY))) restoreScrollY = Number(saved.scrollY);
  } catch {}

  try {
    // no-cache asks the browser to revalidate the generated index, avoiding stale Works data after a new deployment.
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    items = await response.json();
    if (!Array.isArray(items)) throw new Error('Works data is not an array');

    sanitizeRestoredState();
    filtered = items.filter(matches);
    replaceCards(Math.min(visibleCount, Math.max(batchSize, filtered.length)));

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) loadMore();
      }, { rootMargin: '800px 0px' });
      observer.observe(sentinel);
    } else {
      window.addEventListener('scroll', () => {
        if (innerHeight + scrollY > document.documentElement.scrollHeight - 1200) loadMore();
      }, { passive: true });
    }

    if (restoreScrollY != null) {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(0, restoreScrollY)));
    }
  } catch (error) {
    console.error('Works index could not load:', error);
  }

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(updateOverflow);
    page.querySelectorAll('[data-filter-row]').forEach(row => resizeObserver.observe(row));
  } else {
    window.addEventListener('resize', updateOverflow, { passive: true });
  }

  updateOverflow();
})();
