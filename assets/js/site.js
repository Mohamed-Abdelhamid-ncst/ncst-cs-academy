
const LANG=document.documentElement.lang==='ar'?'ar':'en', AR=LANG==='ar', PRE=AR?'../':'';

document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.nav'), menu=document.querySelector('.menu-btn'), links=document.querySelector('.navlinks');
 if(menu&&nav&&links){
  links.id=links.id||'primary-navigation';
  links.setAttribute('aria-label',AR?'التنقل الرئيسي':'Primary navigation');
  menu.setAttribute('aria-controls',links.id);
  menu.setAttribute('aria-label',AR?'القائمة':'Menu');
  // The header Contact button is hidden on small screens, so give the mobile menu its own link.
  const cta=document.querySelector('.nav-right .btn');
  if(cta&&links&&!links.querySelector('.nav-contact')){const a=document.createElement('a');a.className='nav-contact';a.href=cta.getAttribute('href');a.textContent=cta.textContent.replace(/[→←]/g,'').trim();links.appendChild(a);}
  const setOpen=o=>{nav.classList.toggle('open',o);menu.setAttribute('aria-expanded',String(o));};
  menu.setAttribute('aria-expanded','false');
  menu.addEventListener('click',()=>setOpen(!nav.classList.contains('open')));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){setOpen(false);menu.focus();}});
  document.addEventListener('click',e=>{if(!nav.contains(e.target))setOpen(false);});
  nav.addEventListener('focusout',e=>{if(e.relatedTarget&&!nav.contains(e.relatedTarget))setOpen(false);});
  window.matchMedia('(max-width: 1200px)').addEventListener('change',()=>setOpen(false));
  if(links)links.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
 }
 const page=document.body.dataset.page;
 document.querySelectorAll('.navlinks a').forEach(a=>{if(page&&a.dataset.page===page){a.classList.add('active');a.setAttribute('aria-current','page');}});
 document.querySelectorAll('.faq button').forEach((b,i)=>{
  const answer=b.parentElement.querySelector('.answer');
  if(answer){answer.id=answer.id||`faq-answer-${i}`;b.setAttribute('aria-controls',answer.id);}
  b.setAttribute('aria-expanded',String(b.parentElement.classList.contains('open')));
  b.addEventListener('click',()=>b.setAttribute('aria-expanded',String(b.parentElement.classList.toggle('open'))));
 });
 const y=document.querySelector('[data-year]'); if(y)y.textContent=new Date().getFullYear();
});

// All data-driven content goes through esc() before it is written into the page.
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(u){try{const x=new URL(String(u),location.href);return(x.protocol==='https:'||x.protocol==='http:')?x.href:'';}catch(e){return'';}}
function pick(o,key){return AR&&o[key+'_ar']?o[key+'_ar']:o[key];}
function notice(en,ar){return `<div class="notice">${AR?ar:en}</div>`;}
async function loadJSON(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw new Error('Data unavailable');return r.json();}
const CATEGORY_AR={'Awareness':'التوعية','Technical':'الأمن التقني','Operations':'العمليات','Cloud':'السحابة','Governance':'الحوكمة','Emerging Technology':'التقنيات الناشئة','Forensics':'الأدلة الجنائية','Leadership':'القيادة'};
function categoryLabel(category){return AR?(CATEGORY_AR[category]||category):category;}

function courseCard(c){
 const req=AR?'طلب دورة':'Request this course';
 return `<article class="card course-card" data-category="${esc(c.category)}"><div class="card-body"><span class="tag">${esc(categoryLabel(c.category))}</span><h3>${esc(pick(c,'title'))}</h3><p class="muted">${esc(pick(c,'summary'))}</p><div class="course-meta"><span class="mini">${esc(pick(c,'audience'))}</span><span class="mini">${esc(pick(c,'level'))}</span><span class="mini">${esc(pick(c,'duration'))}</span></div></div><a class="card-link" href="contact.html?course=${esc(encodeURIComponent(c.id))}#training">${req} ${AR?'←':'→'}</a></article>`;
}
async function renderCourses(){
 const wrap=document.querySelector('[data-course-grid]'); if(!wrap)return;
 const toolbar=document.querySelector('.catalog-toolbar');
 const search=document.querySelector('[data-course-search]');
 const status=document.querySelector('[data-course-status]');
 wrap.setAttribute('aria-busy','true');
 try{
  const data=await loadJSON(PRE+'assets/data/courses.json');
  if(!Array.isArray(data))throw new Error('Invalid catalogue');
  let category='All';
  if(toolbar)toolbar.innerHTML=['All',...new Set(data.map(c=>c.category))].map(c=>`<button type="button" class="filter-btn${c==='All'?' active':''}" data-filter="${esc(c)}" aria-pressed="${c==='All'}">${esc(c==='All'?(AR?'الكل':'All'):categoryLabel(c))}</button>`).join('');
  const update=()=>{
   const query=(search?search.value:'').trim().toLocaleLowerCase();
   const filtered=data.filter(c=>(category==='All'||c.category===category)&&[pick(c,'title'),pick(c,'summary'),pick(c,'audience'),categoryLabel(c.category)].join(' ').toLocaleLowerCase().includes(query));
   wrap.innerHTML=filtered.length?filtered.map(courseCard).join(''):notice('No courses match. Try another search or category.','لا توجد دورات مطابقة. جرّب بحثًا أو فئة أخرى.');
   if(status)status.textContent=AR?`عرض ${filtered.length} من ${data.length} دورات`:`Showing ${filtered.length} of ${data.length} courses`;
  };
  if(toolbar)toolbar.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
   category=btn.dataset.filter;
   toolbar.querySelectorAll('[data-filter]').forEach(x=>{const active=x===btn;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});
   update();
  }));
  if(search){search.disabled=false;search.addEventListener('input',update);}
  update();
 }catch(e){wrap.innerHTML=notice('Course catalogue is temporarily unavailable. Please contact us for training enquiries.','دليل الدورات غير متاح مؤقتًا. يرجى التواصل معنا للاستفسار عن التدريب.');if(status)status.textContent='';}
 finally{wrap.setAttribute('aria-busy','false');}
}
async function selectRequestedCourse(){
 const course=document.querySelector('[name="course"]');
 const id=new URLSearchParams(location.search).get('course');
 if(!course||!id)return;
 try{
  const data=await loadJSON(PRE+'assets/data/courses.json');
  const selected=data.find(c=>c.id===id);
  if(!selected)return;
  course.value=pick(selected,'title');
  const interest=course.form.querySelector('[name="interest"]');
  const topics={'Awareness':'Cybersecurity Awareness','Technical':'Technical Security','Operations':'SOC / SIEM','Cloud':'Cloud Security','Governance':'Governance & Compliance'};
  if(interest)interest.value=topics[selected.category]||'Custom Program';
  const switcher=document.querySelector('.lang-switch');
  if(switcher){const target=new URL(switcher.href);target.searchParams.set('course',id);target.hash='training';switcher.href=target.href;}
 }catch(e){/* The editable course field remains available when the catalogue is offline. */}
}
async function renderEvents(){
 const wrap=document.querySelector('[data-event-grid]'); if(!wrap)return;
 try{
  const data=await loadJSON(PRE+'assets/data/events.json');
  wrap.innerHTML=data.map(e=>`<article class="card event-card"><div class="card-media"><img src="${esc(PRE+e.image)}" alt="" loading="lazy"></div><div class="card-body"><span class="status">${esc(pick(e,'status'))}</span><div class="meta" style="margin-top:12px">${esc(pick(e,'type'))}</div><h3>${esc(pick(e,'title'))}</h3><p class="muted">${esc(pick(e,'summary'))}</p></div></article>`).join('');
 }catch(e){wrap.innerHTML=notice('Events are temporarily unavailable.','الفعاليات غير متاحة مؤقتًا.');}
}
async function renderOpportunities(){
 const wrap=document.querySelector('[data-opportunity-grid]'); if(!wrap)return;
 // The page ships with the same cards as static HTML; keep them if the data file cannot be loaded.
 try{
  const data=await loadJSON(PRE+'assets/data/opportunities.json');
  if(!Array.isArray(data)||!data.length)return;
  const tag=AR?'':'<span class="tag">OPPORTUNITY</span>';
  wrap.innerHTML=data.map(o=>`<div class="opportunity">${tag}<h3>${esc(pick(o,'title'))}</h3><p class="muted">${esc(pick(o,'summary'))}</p></div>`).join('');
 }catch(e){}
}
function paperDate(v){
 if(!v)return'';const d=new Date(v);
 return isNaN(d)?String(v):d.toLocaleDateString(AR?'ar-BH':'en-GB',{year:'numeric',month:'long',day:'numeric'});
}
async function renderPapers(){
 const wrap=document.querySelector('[data-live-papers]');if(!wrap)return;
 try{
  const r=await fetch(PRE+'api/ojs-feed.php',{cache:'no-cache'});if(!r.ok)throw new Error();
  const d=await r.json();
  if(!d.items||!d.items.length)throw new Error();
  wrap.innerHTML=d.items.slice(0,5).map(p=>{
   const url=safeUrl(p.url), title=esc(p.title);
   return `<div class="paper-item"><h3>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`:title}</h3><small>${esc(paperDate(p.date))}</small><p class="muted">${esc(p.description)}</p></div>`;
  }).join('');
 }catch(e){wrap.innerHTML=notice('Latest white papers will appear here after the OJS feed is connected.','سيظهر هنا أحدث محتوى منصة الأوراق البيضاء بعد ربط OJS.');}
}
document.addEventListener('DOMContentLoaded',()=>{renderCourses();renderEvents();renderOpportunities();renderPapers();selectRequestedCourse();});
