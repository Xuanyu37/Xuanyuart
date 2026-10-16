(async function(){
  await SANQI.ready;

  const els={
    title:document.getElementById('worksTitle'), count:document.getElementById('worksCount'), filters:document.getElementById('filters'),
    grid:document.getElementById('worksGrid'), empty:document.getElementById('worksEmpty'), sentinel:document.getElementById('worksSentinel'), loading:document.getElementById('worksLoading')
  };
  const filters={year:null,medium:null,series:null};
  const batch=48;
  const expandedGroups=new Set();
  let items=[], filtered=[], rendered=0, observer=null, restoring=true, restoreRendered=batch, restoreScroll=0;

  function restoreState(){
    try{
      const state=JSON.parse(sessionStorage.getItem('sanqi-works-state')||'{}');
      Object.assign(filters,state.filters||{}); restoreRendered=Math.max(batch,Number(state.rendered)||batch); restoreScroll=Math.max(0,Number(state.scrollY)||0);
    }catch(e){}
  }
  function saveState(){
    try{sessionStorage.setItem('sanqi-works-state',JSON.stringify({filters,rendered,scrollY:window.scrollY}))}catch(e){}
  }
  addEventListener('pagehide',saveState);

  async function loadCatalog(){
    const master=await SANQI.fetchJSON('content/works/index.json');
    const years=(master.years||[]).map(String);
    const lists=await Promise.all(years.map(async year=>{
      try{const data=await SANQI.fetchJSON(`content/works/${encodeURIComponent(year)}/index.json`);return (data.items||[]).filter(item=>item.published!==false)}
      catch(e){console.warn('Year index failed:',year,e);return[]}
    }));
    items=lists.flat();
  }

  function allYears(){const set=new Set();items.forEach(item=>SANQI.yearList(item.years).forEach(y=>set.add(y)));return [...set].sort((a,b)=>b-a)}
  function allMediums(){const set=new Set();items.forEach(item=>SANQI.mediumKeys(item.medium).forEach(m=>set.add(m)));return [...set].sort((a,b)=>(SANQI.localize(SANQI.config.mediums?.[a],SANQI.lang)||a).localeCompare(SANQI.localize(SANQI.config.mediums?.[b],SANQI.lang)||b,SANQI.lang))}
  function allSeries(){const map=new Map();items.forEach(item=>{if(item.series?.id)map.set(item.series.id,SANQI.localize(item.series.title,SANQI.lang)||item.series.id)});return [...map.entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),SANQI.lang))}

  function renderTitle(){els.title.textContent=SANQI.localize(SANQI.config.navigation.works,SANQI.lang)}
  function group(name,label,values){
    const all=SANQI.localize(SANQI.config.ui.all,SANQI.lang);
    return `<div class="filter-group ${expandedGroups.has(name)?'expanded':''}" data-group="${SANQI.attr(name)}"><div class="filter-label">${SANQI.esc(label)}</div><div class="filter-options-shell"><div class="filter-options"><button type="button" data-value="" class="${!filters[name]?'active':''}">${SANQI.esc(all)}</button>${values.map(([value,text])=>`<button type="button" data-value="${SANQI.attr(value)}" class="${String(filters[name])===String(value)?'active':''}">${SANQI.esc(text)}</button>`).join('')}</div><button class="filter-more" type="button" aria-label="More" aria-expanded="false">＋</button></div></div>`;
  }
  function renderFilters(){
    const years=allYears().map(y=>[y,String(y)]);
    const mediums=allMediums().map(m=>[m,SANQI.localize(SANQI.config.mediums?.[m],SANQI.lang)||m]);
    const series=allSeries();
    els.filters.innerHTML=group('year',SANQI.localize(SANQI.config.ui.year,SANQI.lang),years)+group('medium',SANQI.localize(SANQI.config.ui.medium,SANQI.lang),mediums)+group('series',SANQI.localize(SANQI.config.ui.series,SANQI.lang),series);
    els.filters.querySelectorAll('.filter-options button').forEach(button=>button.addEventListener('click',()=>{
      const name=button.closest('[data-group]').dataset.group;
      filters[name]=button.dataset.value||null;
      restoring=false; restoreRendered=batch; restoreScroll=0; window.scrollTo(0,0); saveState(); renderFilters(); apply(batch);
    }));
    els.filters.querySelectorAll('.filter-more').forEach(button=>button.addEventListener('click',()=>{
      const group=button.closest('.filter-group'), name=group.dataset.group, open=!group.classList.contains('expanded');
      group.classList.toggle('expanded',open);button.setAttribute('aria-expanded',open?'true':'false');
      if(open)expandedGroups.add(name);else expandedGroups.delete(name);
    }));
    requestAnimationFrame(checkOverflow);
  }
  function checkOverflow(){
    els.filters.querySelectorAll('.filter-group').forEach(group=>{
      const options=group.querySelector('.filter-options'), more=group.querySelector('.filter-more'), buttons=[...options.querySelectorAll('button')];
      const firstTop=buttons[0]?.offsetTop ?? 0;
      const over=buttons.some(button=>button.offsetTop>firstTop+3);
      group.classList.toggle('has-overflow',over);
      if(!over){group.classList.remove('expanded');expandedGroups.delete(group.dataset.group);more.setAttribute('aria-expanded','false')}
      else more.setAttribute('aria-expanded',group.classList.contains('expanded')?'true':'false');
    });
  }
  addEventListener('resize',()=>requestAnimationFrame(checkOverflow));

  function validateFilters(){
    const years=new Set(allYears().map(String)), mediums=new Set(allMediums()), series=new Set(allSeries().map(x=>x[0]));
    if(filters.year&&!years.has(String(filters.year)))filters.year=null;
    if(filters.medium&&!mediums.has(filters.medium))filters.medium=null;
    if(filters.series&&!series.has(filters.series))filters.series=null;
  }
  function apply(target=batch){
    filtered=items.filter(item=>(!filters.year||SANQI.yearList(item.years).map(String).includes(String(filters.year)))&&(!filters.medium||SANQI.mediumKeys(item.medium).includes(filters.medium))&&(!filters.series||item.series?.id===filters.series));
    filtered.sort((a,b)=>Math.max(...SANQI.yearList(b.years),0)-Math.max(...SANQI.yearList(a.years),0));
    rendered=0;els.grid.innerHTML='';els.empty.classList.toggle('show',filtered.length===0);els.empty.textContent=SANQI.localize(SANQI.config.ui.noWorks,SANQI.lang);els.count.textContent=SANQI.countLabel(filtered.length);
    while(rendered<Math.min(target,filtered.length)) appendBatch(false);
    els.loading.textContent=rendered<filtered.length?'…':'';
  }
  function card(item){
    const aspect=['portrait','square'].includes(item.aspect)?` aspect-${item.aspect}`:'';
    const secondary=[SANQI.yearLabel(item.years),SANQI.mediumLabel(item.medium)].filter(Boolean).join(' · ');
    return `<a class="work-card${aspect}" href="${SANQI.attr(SANQI.detailURL(item))}"><div class="work-thumb"><img loading="lazy" decoding="async" src="${SANQI.attr(SANQI.mediaURL(item.path,item.cover))}" alt=""></div><div class="work-meta"><span>${SANQI.esc(SANQI.title(item)||'')}</span><span class="work-secondary">${SANQI.esc(secondary)}</span></div></a>`;
  }
  function appendBatch(updateLoading=true){
    if(rendered>=filtered.length){if(updateLoading)els.loading.textContent='';return}
    const next=filtered.slice(rendered,rendered+batch); els.grid.insertAdjacentHTML('beforeend',next.map(card).join('')); rendered+=next.length;
    if(updateLoading)els.loading.textContent=rendered<filtered.length?'…':'';
  }
  function setupObserver(){
    observer?.disconnect();
    if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))appendBatch()},{rootMargin:'700px 0px'});observer.observe(els.sentinel)}
    else addEventListener('scroll',()=>{if(innerHeight+scrollY>document.body.offsetHeight-900)appendBatch()},{passive:true});
  }

  addEventListener('sanqi:language',()=>{const keep=Math.max(rendered,batch);renderTitle();renderFilters();apply(keep)});

  try{
    restoreState(); await loadCatalog(); validateFilters(); renderTitle(); renderFilters(); apply(restoreRendered); setupObserver();
    if(restoring&&restoreScroll) requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo(0,restoreScroll)));
    restoring=false;
  }catch(e){console.error(e);renderTitle();els.empty.classList.add('show');els.empty.textContent=SANQI.localize(SANQI.config.ui.loadError,SANQI.lang)}
})();
