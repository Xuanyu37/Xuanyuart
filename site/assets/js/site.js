(function(){
  const S = window.SANQI = window.SANQI || {};
  const CONFIG_URL = 'content/site.json';
  const page = document.body.dataset.page || '';
  const fileForPage = {home:'index.html',works:'works.html',cv:'cv.html',about:'about.html',contact:'contact.html'};

  S.storeGet = function(key){ try{return localStorage.getItem(key)}catch(e){return null} };
  S.storeSet = function(key,value){ try{localStorage.setItem(key,value)}catch(e){} };
  S.fetchJSON = async function(url){
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  };
  S.esc = function(value){ return String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch])); };
  S.attr = S.esc;
  S.localize = function(value, lang){
    if(value == null) return '';
    if(typeof value === 'string' || typeof value === 'number') return String(value);
    if(Array.isArray(value)) return value.join('\n\n');
    if(typeof value === 'object'){
      const result=value[lang] ?? value.fr ?? value.en ?? value.zh ?? '';
      return Array.isArray(result) ? result.join('\n\n') : result;
    }
    return '';
  };
  S.safePath = function(value){
    const p = String(value || '').trim().replace(/^\/+|\/+$/g,'');
    if(!p || p.includes('..') || p.includes('\\')) return '';
    return p;
  };
  S.encodePath = function(value){ return String(value || '').split('/').filter(Boolean).map(encodeURIComponent).join('/'); };
  S.mediaURL = function(path, file){
    const p = S.safePath(path); const f = String(file || '').replace(/^\/+/, '');
    if(!p || !f || f.includes('..') || f.includes('\\')) return '';
    return `content/works/${S.encodePath(p)}/${S.encodePath(f)}`;
  };
  S.dataURL = function(path, file){ const p=S.safePath(path); return p ? `content/works/${S.encodePath(p)}/${file}` : ''; };
  S.detailURL = function(item){
    const target = item.type === 'series' ? 'series.html' : 'work.html';
    return `${target}?path=${encodeURIComponent(item.path)}`;
  };
  S.yearList = function(years){
    if(typeof years === 'number' || typeof years === 'string') return [Number(years)].filter(Number.isFinite);
    if(Array.isArray(years)) return years.map(Number).filter(Number.isFinite);
    if(years && typeof years === 'object'){
      const a=Number(years.from), b=Number(years.to);
      if(Number.isFinite(a)&&Number.isFinite(b)){
        const out=[]; const lo=Math.min(a,b), hi=Math.max(a,b); for(let y=lo;y<=hi;y++) out.push(y); return out;
      }
    }
    return [];
  };
  S.yearLabel = function(years){
    const ys = S.yearList(years); if(!ys.length) return '';
    const min=Math.min(...ys), max=Math.max(...ys); return min===max ? String(min) : `${min}–${max}`;
  };
  S.title = function(item){ return S.localize(item?.title,S.lang); };
  S.mediumKeys = function(keys){ return Array.isArray(keys)?keys:(keys?[keys]:[]); };
  S.mediumLabel = function(keys){
    const arr = S.mediumKeys(keys);
    return arr.map(k=>S.localize(S.config.mediums?.[k],S.lang)||k).join(' / ');
  };
  S.countLabel = function(n){
    const key=n===1?'worksCountOne':'worksCountMany';
    return S.localize(S.config.ui[key],S.lang).replace('{n}',n);
  };
  S.setLanguage = function(lang){
    if(!S.config.languages[lang]) return;
    S.lang=lang; S.storeSet('sanqi-language',lang); document.documentElement.lang=lang==='zh'?'zh-CN':lang;
    renderShell(); window.dispatchEvent(new CustomEvent('sanqi:language'));
  };
  S.toggleTheme = function(){
    const dark=!document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark',dark); S.storeSet('sanqi-theme',dark?'dark':'light'); renderThemeLabels();
  };

  function renderThemeLabels(){
    const dark=document.documentElement.classList.contains('dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.textContent=S.localize(S.config.ui[dark?'light':'dark'],S.lang));
  }
  function navLink(key){
    const file=fileForPage[key]; const cls=page===key?'active':'';
    return `<a class="${cls}" href="${file}" data-nav="${key}">${S.esc(S.localize(S.config.navigation[key],S.lang))}</a>`;
  }
  function langButtons(cls){
    return `<div class="${cls}">`+Object.entries(S.config.languages).map(([k,label],i)=>`${i?'<span>/</span>':''}<button type="button" data-lang="${S.attr(k)}" class="${S.lang===k?'active':''}">${S.esc(label)}</button>`).join('')+`</div>`;
  }
  function renderShell(){
    const header=document.getElementById('siteHeader');
    if(header){
      header.className='site-header';
      header.innerHTML=`<a class="brand" href="index.html">${S.esc(S.config.name)}</a><nav class="desktop-nav" aria-label="Main navigation">${navLink('home')}${navLink('works')}${navLink('cv')}${navLink('about')}${navLink('contact')}${langButtons('lang-switch')}<button class="theme-toggle" type="button" data-theme-toggle></button></nav><button class="mobile-menu-btn" type="button" aria-label="Menu" data-menu-open>☰</button>`;
    }
    const drawer=document.getElementById('siteDrawer');
    if(drawer){
      const wasOpen=drawer.classList.contains('open');
      drawer.className=`drawer-layer${wasOpen?' open':''}`;
      drawer.setAttribute('aria-hidden',wasOpen?'false':'true');
      drawer.innerHTML=`<div class="drawer-backdrop" data-drawer-backdrop></div><aside class="drawer"><button class="drawer-close" type="button" data-drawer-close>${S.esc(S.localize(S.config.ui.close,S.lang))}</button><nav class="drawer-nav">${navLink('home')}${navLink('works')}${navLink('cv')}${navLink('about')}${navLink('contact')}</nav>${langButtons('drawer-lang')}<button class="drawer-theme" type="button" data-theme-toggle></button></aside>`;
    }
    const footer=document.getElementById('siteFooter');
    if(footer){ footer.className='site-footer'; footer.textContent=`© ${new Date().getFullYear()} ${S.config.name}`; }
    bindShell(); renderThemeLabels();
    document.title = `${S.config.name}${page && page!=='home' ? ' — '+S.localize(S.config.navigation[page]||page,S.lang) : ''}`;
  }
  function openDrawer(){ const d=document.getElementById('siteDrawer'); if(!d)return; d.classList.add('open');d.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');d.querySelector('[data-drawer-close]')?.focus(); }
  function closeDrawer(){ const d=document.getElementById('siteDrawer'); if(!d)return; d.classList.remove('open');d.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll'); }
  function bindShell(){
    document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>S.setLanguage(b.dataset.lang)));
    document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',S.toggleTheme));
    document.querySelector('[data-menu-open]')?.addEventListener('click',openDrawer);
    document.querySelector('[data-drawer-close]')?.addEventListener('click',closeDrawer);
    document.querySelector('[data-drawer-backdrop]')?.addEventListener('click',closeDrawer);
    document.querySelectorAll('.drawer-nav a').forEach(a=>a.addEventListener('click',closeDrawer));
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeDrawer();});

  S.ready=(async()=>{
    S.config=await S.fetchJSON(CONFIG_URL);
    const savedLang=S.storeGet('sanqi-language');
    S.lang=S.config.languages[savedLang]?savedLang:S.config.defaultLanguage;
    document.documentElement.lang=S.lang==='zh'?'zh-CN':S.lang;
    const theme=S.storeGet('sanqi-theme'); if(theme==='dark') document.documentElement.classList.add('dark');
    renderShell(); return S;
  })().catch(err=>{console.error(err); const main=document.querySelector('main'); if(main) main.innerHTML='<div class="page">Site configuration error.</div>';});
})();
