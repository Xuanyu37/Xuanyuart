(async function(){
  await SANQI.ready;

  const kind=document.body.dataset.detailType;
  const path=SANQI.safePath(new URLSearchParams(location.search).get('path'));
  const root=document.getElementById('detailRoot');
  let data=null, lightboxItems=[], lightboxIndex=0, touchX=null;

  function fail(key='notFound'){
    root.innerHTML=`<a class="detail-back" href="works.html">${SANQI.esc(SANQI.localize(SANQI.config.ui.backWorks,SANQI.lang))}</a><p class="subtle">${SANQI.esc(SANQI.localize(SANQI.config.ui[key],SANQI.lang))}</p>`;
  }
  if(!path){fail();return}

  try{
    data=await SANQI.fetchJSON(SANQI.dataURL(path,kind==='series'?'series.json':'work.json'));
    if(data.published===false){fail();return}
  }catch(e){console.error(e);fail('loadError');return}

  const L=value=>SANQI.localize(value,SANQI.lang);
  const E=value=>SANQI.esc(value);
  const imageObj=value=>typeof value==='string'?{src:value}:value;
  function mediaLine(){return L(data.mediumText)||SANQI.mediumLabel(data.medium)}

  function imageHTML(value,index,isSeries=false){
    const item=imageObj(value), src=SANQI.mediaURL(path,item.src), alt=L(item.alt)||'', caption=L(item.caption)||'';
    const wrapper=isSeries?`series-item pattern-${(index%6)+1}`:'detail-image-item';
    const imageClass=isSeries?'series-image':'art-image';
    const captionClass=isSeries?'series-caption':'media-caption';
    return `<div class="${wrapper}"><button class="art-image-button" type="button" data-lightbox="${index}"><div class="${imageClass}"><img loading="${index?'lazy':'eager'}" decoding="async" src="${SANQI.attr(src)}" alt="${SANQI.attr(alt)}"></div></button>${caption?`<div class="${captionClass}">${E(caption)}</div>`:''}</div>`;
  }

  function extraMedia(){
    let html='';
    if(data.video?.src){
      html+=`<div><video class="video-player" controls preload="metadata" ${data.video.poster?`poster="${SANQI.attr(SANQI.mediaURL(path,data.video.poster))}"`:''}><source src="${SANQI.attr(SANQI.mediaURL(path,data.video.src))}"></video>${L(data.video.caption)?`<div class="media-caption">${E(L(data.video.caption))}</div>`:''}</div>`;
    }
    if(data.audio?.src){
      html+=`<div><audio class="audio-player" controls preload="metadata" src="${SANQI.attr(SANQI.mediaURL(path,data.audio.src))}"></audio>${L(data.audio.caption)?`<div class="media-caption">${E(L(data.audio.caption))}</div>`:''}</div>`;
    }
    return html;
  }
  function infoLines(){
    const lines=[], medium=mediaLine();
    if(medium)lines.push(`<p>${E(medium)}</p>`);
    if(data.dimensions)lines.push(`<p>${E(L(data.dimensions))}</p>`);
    if(data.duration)lines.push(`<p>${E(data.duration)}</p>`);
    return lines.join('');
  }

  function render(){
    document.title=`${SANQI.title(data)} — ${SANQI.config.name}`;
    const images=(data.images||[]).map(imageObj);
    if(kind==='series'){
      root.innerHTML=`<a class="detail-back" href="works.html">${E(SANQI.localize(SANQI.config.ui.backWorks,SANQI.lang))}</a><div class="series-head"><h1>${E(SANQI.title(data))}</h1>${SANQI.yearLabel(data.years)?`<p>${E(SANQI.yearLabel(data.years))}</p>`:''}${infoLines()}${L(data.description)?`<p class="series-copy">${E(L(data.description))}</p>`:''}</div>${extraMedia()}<div class="series-gallery">${images.map((x,i)=>imageHTML(x,i,true)).join('')}</div>`;
    }else{
      const title=`${SANQI.title(data)}${SANQI.yearLabel(data.years)?`, ${SANQI.yearLabel(data.years)}`:''}`;
      const seriesLink=data.series?.path?`<a class="detail-series-link" href="series.html?path=${encodeURIComponent(data.series.path)}">${E(L(data.series.title)||data.series.id||'')} →</a>`:'';
      root.innerHTML=`<a class="detail-back" href="works.html">${E(SANQI.localize(SANQI.config.ui.backWorks,SANQI.lang))}</a><div class="detail-grid"><div class="detail-media">${images.map((x,i)=>imageHTML(x,i,false)).join('')}${extraMedia()}</div><div class="detail-info"><h1>${E(title)}</h1>${infoLines()}${L(data.description)?`<p class="detail-description">${E(L(data.description))}</p>`:''}${seriesLink}</div></div>`;
    }
    bindLightbox(images);
  }

  function bindLightbox(images){
    lightboxItems=images;
    root.querySelectorAll('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>openLightbox(Number(button.dataset.lightbox))));
  }
  const box=document.getElementById('lightbox');
  function updateLightbox(){
    if(!box||!lightboxItems.length)return;
    const item=lightboxItems[lightboxIndex], src=SANQI.mediaURL(path,item.src), alt=L(item.alt)||'';
    box.querySelector('[data-lightbox-image]').innerHTML=`<img src="${SANQI.attr(src)}" alt="${SANQI.attr(alt)}">`;
    box.querySelector('[data-lightbox-prev]').style.visibility=lightboxItems.length>1?'visible':'hidden';
    box.querySelector('[data-lightbox-next]').style.visibility=lightboxItems.length>1?'visible':'hidden';
  }
  function openLightbox(index){
    if(!lightboxItems.length)return;
    lightboxIndex=index;box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');updateLightbox();box.querySelector('[data-lightbox-close]')?.focus();
  }
  function closeLightbox(){box.classList.remove('open');box.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')}
  function move(delta){lightboxIndex=(lightboxIndex+delta+lightboxItems.length)%lightboxItems.length;updateLightbox()}

  box.querySelector('[data-lightbox-close]').addEventListener('click',closeLightbox);
  box.querySelector('[data-lightbox-prev]').addEventListener('click',()=>move(-1));
  box.querySelector('[data-lightbox-next]').addEventListener('click',()=>move(1));
  box.querySelector('.lightbox-stage').addEventListener('click',e=>{if(e.target===e.currentTarget)closeLightbox()});
  box.addEventListener('touchstart',e=>touchX=e.touches[0].clientX,{passive:true});
  box.addEventListener('touchend',e=>{if(touchX==null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>42)move(dx<0?1:-1);touchX=null},{passive:true});
  document.addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});

  function renderLightboxLabel(){box.querySelector('[data-lightbox-close]').textContent=SANQI.localize(SANQI.config.ui.close,SANQI.lang)}
  addEventListener('sanqi:language',()=>{render();renderLightboxLabel();if(box.classList.contains('open'))updateLightbox()});
  renderLightboxLabel();
  render();
})();
