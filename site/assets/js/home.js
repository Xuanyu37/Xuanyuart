(async function(){
  await SANQI.ready;
  const root=document.getElementById('homeRoot');
  let pageData={feature:[],secondary:[]};
  let slides=[], secondary=[], timer=null, index=0, touchX=null;

  try{ pageData=await SANQI.fetchJSON('content/pages/home.json'); }
  catch(e){ console.error(e); return; }

  async function loadRef(ref){
    if(!ref?.path || !ref?.type) return null;
    const path=SANQI.safePath(ref.path); if(!path) return null;
    const file=ref.type==='series'?'series.json':'work.json';
    try{
      const data=await SANQI.fetchJSON(SANQI.dataURL(path,file));
      if(data.published===false) return null;
      return {...data,path,type:ref.type};
    }catch(e){ console.warn('Home item unavailable:',path,e); return null; }
  }

  async function render(){
    stop();
    slides=(await Promise.all((pageData.feature||[]).map(loadRef))).filter(Boolean);
    secondary=(await Promise.all((pageData.secondary||[]).map(loadRef))).filter(Boolean);
    index=Math.min(index,Math.max(0,slides.length-1));

    if(!slides.length && !secondary.length){ root.innerHTML=''; return; }
    let html='';
    if(slides.length){
      html+=`<section class="feature" tabindex="0">
        <div class="feature-stage">
          ${slides.map((d,i)=>`<a class="slide ${i===index?'active':''}" href="${SANQI.attr(SANQI.detailURL(d))}" tabindex="${i===index?'0':'-1'}"><img src="${SANQI.attr(SANQI.mediaURL(d.path,d.cover))}" alt="" fetchpriority="${i===0?'high':'auto'}"></a>`).join('')}
          ${slides.length>1?'<button class="feature-control prev" type="button" data-prev aria-label="Previous">←</button><button class="feature-control next" type="button" data-next aria-label="Next">→</button>':''}
        </div>
        <div class="feature-meta"><a class="feature-title" id="featureTitle"></a><div class="feature-count" id="featureCount"></div></div>
      </section>`;
    }
    if(secondary.length){
      html+=`<section class="home-secondary">${secondary.map(d=>`<a class="home-card" href="${SANQI.attr(SANQI.detailURL(d))}"><div class="home-card-media"><img loading="lazy" decoding="async" src="${SANQI.attr(SANQI.mediaURL(d.path,d.cover))}" alt=""></div><div class="home-card-meta">${SANQI.esc(SANQI.title(d))}${SANQI.yearLabel(d.years)?`, ${SANQI.esc(SANQI.yearLabel(d.years))}`:''}</div></a>`).join('')}</section>`;
    }
    root.innerHTML=html;
    bind(); update(); start();
  }

  function update(){
    if(!slides.length) return;
    root.querySelectorAll('.slide').forEach((el,i)=>{el.classList.toggle('active',i===index);el.tabIndex=i===index?0:-1});
    const data=slides[index], title=document.getElementById('featureTitle'), count=document.getElementById('featureCount');
    if(title){title.textContent=`${SANQI.title(data)}${SANQI.yearLabel(data.years)?`, ${SANQI.yearLabel(data.years)}`:''}`;title.href=SANQI.detailURL(data)}
    if(count) count.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
  }
  function go(delta){ index=(index+delta+slides.length)%slides.length; update(); stop(); setTimeout(start,10000); }
  function start(){ if(slides.length<2||matchMedia('(prefers-reduced-motion: reduce)').matches)return; stop(); timer=setInterval(()=>{index=(index+1)%slides.length;update()},6000); }
  function stop(){ if(timer){clearInterval(timer);timer=null} }
  function bind(){
    const feature=root.querySelector('.feature'); if(!feature)return;
    feature.querySelector('[data-prev]')?.addEventListener('click',e=>{e.preventDefault();go(-1)});
    feature.querySelector('[data-next]')?.addEventListener('click',e=>{e.preventDefault();go(1)});
    feature.addEventListener('mouseenter',stop); feature.addEventListener('mouseleave',start);
    feature.addEventListener('focusin',stop); feature.addEventListener('focusout',start);
    feature.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();go(-1)} if(e.key==='ArrowRight'){e.preventDefault();go(1)}});
    feature.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;stop()},{passive:true});
    feature.addEventListener('touchend',e=>{if(touchX==null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>42)go(dx<0?1:-1);else start();touchX=null},{passive:true});
  }

  addEventListener('sanqi:language',render);
  await render();
})();
