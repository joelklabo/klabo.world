const DATA = window.BROWN_COURT_DATA;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const lightbox = $('#lightbox');

function openImage(src, title, full){ $('#lightboxImage').src = src; $('#lightboxTitle').textContent = title || 'Source image'; $('#lightboxFull').href = full || src; lightbox.showModal(); }
$('.close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', e => { if(e.target === lightbox) lightbox.close(); });
function sourceCard(s){ return `<article class="source-card" data-status="${s.status}"><img loading="lazy" decoding="async" src="${s.chat}" alt="${s.title}"><div class="body"><div class="meta"><span class="pill">${s.date}</span><span class="pill">${s.status}</span></div><h3>${s.title}</h3><p><b>${s.publication}</b>, ${s.page}. ${s.supports}</p></div><div class="card-actions"><button class="mini-button" data-open="${s.id}">View image</button><a class="mini-button" href="${s.full}">Full page</a></div></article>`; }
function renderSources(filter='all'){ $('#sourceGrid').innerHTML = DATA.sources.filter(s => filter==='all' || s.status.includes(filter)).map(sourceCard).join(''); $$('[data-open]').forEach(btn => btn.addEventListener('click', () => { const s=DATA.sources.find(x=>x.id===btn.dataset.open); openImage(s.chat, s.title, s.full); })); }
function renderTimeline(){ $('#timelineList').innerHTML = DATA.timeline.map(t => `<div class="time-item"><time>${t.date}</time><h3>${t.title}</h3><p>${t.text}</p></div>`).join(''); }
function renderGallery(){ $('#galleryGrid').innerHTML = DATA.photos.map((p,i) => `<figure class="gallery-item" data-photo="${i}"><img loading="lazy" decoding="async" src="${p.src}" alt="${p.title}"><figcaption><b>${p.date}</b><br>${p.title}</figcaption></figure>`).join(''); $$('.gallery-item').forEach(el => el.addEventListener('click', () => { const p=DATA.photos[Number(el.dataset.photo)]; openImage(p.src, p.title, p.src); })); }
function renderCorrections(){ $('#correctionTable').innerHTML = DATA.corrections.map(r => `<div class="correction-row"><b>${r[0]}</b><span>${r[1]}</span><small>${r[2]}</small></div>`).join(''); }
function searchableDocs(){
 const story = [...document.querySelectorAll('#story p,#inside p,#story li,#inside li')].map(n=>n.textContent).join(' ');
 return [{kind:'Story', title:'Narrative storyline', date:'1924', text:story}, ...DATA.timeline.map(t=>({kind:'Timeline', title:t.title, date:t.date, text:t.text})), ...DATA.sources.map(s=>({kind:s.status, title:s.title, date:s.date, text:`${s.publication} ${s.page}. ${s.supports} ${s.keywords}`})), ...DATA.photos.map(p=>({kind:'Image', title:p.title, date:p.date, text:p.title}))];
}
function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function runSearch(q){ const box=$('#searchResults'); q=q.trim(); if(!q){ box.innerHTML='<p class="result">Type a keyword to search the narrative, timeline, image titles, and source-card notes.</p>'; return; } const rx = new RegExp(`(${escapeRegExp(q)})`,'ig'); const hits=searchableDocs().map(d=>({...d, hay:`${d.title} ${d.date} ${d.text}`})).filter(d=>d.hay.toLowerCase().includes(q.toLowerCase())).slice(0,30); box.innerHTML = hits.length ? hits.map(d=>{ const snippet=d.text.length>260?d.text.slice(0,260)+'…':d.text; return `<article class="result"><h3>${d.title}</h3><div class="meta"><span class="pill">${d.kind}</span><span class="pill">${d.date}</span></div><p>${snippet.replace(rx,'<mark>$1</mark>')}</p></article>`; }).join('') : `<p class="result">No matches for <b>${q}</b>. Try a name, date, appliance, or source phrase.</p>`; }
renderSources(); renderTimeline(); renderGallery(); renderCorrections(); runSearch('');
$$('.chip').forEach(chip => chip.addEventListener('click', () => { $$('.chip').forEach(c=>c.classList.remove('active')); chip.classList.add('active'); renderSources(chip.dataset.filter); }));
$('#searchInput').addEventListener('input', e => runSearch(e.target.value));
$$('.image-button').forEach(btn => btn.addEventListener('click', () => openImage(btn.dataset.image, btn.dataset.title, btn.dataset.image)));
