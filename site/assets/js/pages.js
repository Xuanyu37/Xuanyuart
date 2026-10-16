(async function(){
  await SANQI.ready;

  const page=document.body.dataset.page;
  const root=document.getElementById('pageRoot');
  let data={};
  try{data=await SANQI.fetchJSON(`content/pages/${page}.json`)}catch(e){console.error(e)}

  const L=value=>SANQI.localize(value,SANQI.lang);
  const E=value=>SANQI.esc(value);

  function renderAbout(){
    const photo=data.photo?`<div class="about-image-wrap"><div class="about-image ${data.photoAspect==='landscape'?'landscape':''}"><img src="${SANQI.attr(data.photo)}" alt="${SANQI.attr(L(data.photoAlt))}"></div></div>`:'';
    root.innerHTML=`<h1 class="page-title">${E(SANQI.localize(SANQI.config.navigation.about,SANQI.lang))}</h1><div class="text-page about-grid ${photo?'':'no-photo'}">${photo}<div class="about-copy"><section><h2>${E(SANQI.localize(SANQI.config.ui.biography,SANQI.lang))}</h2><p>${E(L(data.biography))}</p></section><section><h2>${E(SANQI.localize(SANQI.config.ui.statement,SANQI.lang))}</h2><p>${E(L(data.statement))}</p></section></div></div>`;
  }

  function renderCV(){
    const pdf=data.pdf?`<a class="pdf-link" href="${SANQI.attr(data.pdf)}" target="_blank" rel="noopener">${E(SANQI.localize(SANQI.config.ui.downloadCV,SANQI.lang))}</a>`:'';
    root.innerHTML=`<div class="cv-head"><h1>CV</h1>${pdf}</div>${(data.sections||[]).map(section=>`<section class="cv-section"><h2>${E(L(section.title))}</h2><div class="cv-list">${(section.items||[]).map(item=>`<div class="cv-row"><span>${E(item.year||'')}</span><span>${E(L(item.text))}</span></div>`).join('')}</div></section>`).join('')}`;
  }

  function renderContact(){
    const links=[];
    if(data.email)links.push(`<a href="mailto:${SANQI.attr(data.email)}">${E(data.email)}</a>`);
    if(data.instagram)links.push(`<a href="${SANQI.attr(data.instagram)}" target="_blank" rel="noopener">Instagram ↗</a>`);
    (data.links||[]).forEach(link=>{if(link.url)links.push(`<a href="${SANQI.attr(link.url)}" target="_blank" rel="noopener">${E(L(link.label)||link.url)} ↗</a>`)});
    root.innerHTML=`<h1 class="page-title">${E(SANQI.localize(SANQI.config.navigation.contact,SANQI.lang))}</h1><div class="text-page">${L(data.intro)?`<p>${E(L(data.intro))}</p>`:''}<div class="contact-list">${links.join('')}</div></div>`;
  }

  function render(){
    if(page==='about')renderAbout();
    else if(page==='cv')renderCV();
    else if(page==='contact')renderContact();
  }
  addEventListener('sanqi:language',render);
  render();
})();
