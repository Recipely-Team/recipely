/* Recipely · recipely.net/about — behaviour. Vanilla JS, no dependencies. */
(function(){
'use strict';
const STR=window.ABOUT_STR,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)');
const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
let lang='en',S=STR.en,theme='pearl-white',scheme='light';
const fmt=(s,o)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>o[k]);
const num=v=>v.toLocaleString(lang==='tr'?'tr-TR':'en-US',{maximumFractionDigits:1});
const ico=(id,cls)=>`<svg${cls?` class="${cls}"`:''} aria-hidden="true"><use href="#${id}"/></svg>`;

/* ── palettes: the app's 4 themes (src/presentation/base/theme/colors/palette/themes.ts) ── */
const PAL={
'pearl-white':{light:{primary:'#1D4ED8',onP:'#FFFFFF',soft:'#DBEAFE',g1:'#3B82F6',g2:'#60A5FA',bg:'#E8EFFB',text:'#0F172A',muted:'#64748B'},dark:{primary:'#60A5FA',onP:'#0B0B0D',soft:'#1E3A5F',g1:'#3B82F6',g2:'#93C5FD',bg:'#0A1A33',text:'#F1F5F9',muted:'#64748B'}},
'crimson-ember':{light:{primary:'#B91C1C',onP:'#FFFFFF',soft:'#FEE2E2',g1:'#DC2626',g2:'#F87171',bg:'#FBE7E7',text:'#1F1F1F',muted:'#6B7280'},dark:{primary:'#F87171',onP:'#1F1F1F',soft:'#450A0A',g1:'#EF4444',g2:'#FCA5A5',bg:'#1A0309',text:'#FEF2F2',muted:'#A78B8B'}},
'emerald-garden':{light:{primary:'#053A29',onP:'#FFFFFF',soft:'#D1FAE5',g1:'#059669',g2:'#34D399',bg:'#D6F2E2',text:'#1A2E1A',muted:'#6B7280'},dark:{primary:'#34D399',onP:'#1A2E1A',soft:'#022C22',g1:'#10B981',g2:'#6EE7B7',bg:'#04382B',text:'#ECFDF5',muted:'#70A090'}},
'royal-purple':{light:{primary:'#7E22CE',onP:'#FFFFFF',soft:'#F3E8FF',g1:'#9333EA',g2:'#C084FC',bg:'#EDDDFB',text:'#3B0764',muted:'#6B7280'},dark:{primary:'#C084FC',onP:'#3B0764',soft:'#3B0764',g1:'#A855F7',g2:'#E9D5FF',bg:'#2A075F',text:'#FAF5FF',muted:'#9878A8'}}
};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>{const A=rgb(a),B=rgb(b);return '#'+A.map((x,i)=>Math.round(x+(B[i]-x)*t).toString(16).padStart(2,'0')).join('')};
function tokens(id,sc){
  const p=PAL[id][sc],L=sc==='light';
  return {
    '--bg':p.bg,'--surface':L?mix(p.bg,'#FFFFFF',.55):mix(p.bg,'#52535A',.22),'--card':L?'#FFFFFF':mix(p.bg,'#52535A',.36),
    '--text':p.text,'--text2':L?mix(p.muted,p.text,.45):mix(p.text,p.bg,.22),'--muted':L?mix(p.muted,p.text,.2):mix(p.text,p.bg,.4),
    '--primary':p.primary,'--on-primary':p.onP,'--soft':p.soft,'--g1':p.g1,'--g2':p.g2,
    '--line':L?p.muted+'33':p.text+'1F','--shadow':L?'15,23,42':'0,0,0',
    '--band1':L?(id==='pearl-white'?'#2F6BF0':p.g1):mix(p.bg,p.g1,.6),'--band2':L?(id==='pearl-white'?'#1B47CC':p.primary):mix(p.bg,p.g1,.26),
    '--hl':PAL[id].light.soft
  };
}
function applyTheme(){
  const t=tokens(theme,scheme);Object.entries(t).forEach(([k,v])=>root.style.setProperty(k,v));
  root.dataset.scheme=scheme;root.dataset.theme=theme;
  const m=$('meta[name="theme-color"]');if(m)m.content=t['--band2'];
  $$('.tb').forEach(b=>b.setAttribute('aria-pressed',b.dataset.theme===theme));
  $$('[data-scheme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scheme===scheme));
  $('#schemeBtn').setAttribute('aria-label',S[scheme==='dark'?'nav.toLight':'nav.toDark']);
}
$$('.tb').forEach(b=>{const l=PAL[b.dataset.theme].light;b.querySelector('.sw').style.background=`linear-gradient(135deg,${l.g1},${l.primary})`;
  b.addEventListener('click',()=>{theme=b.dataset.theme;store.set('rcp.theme',theme);applyTheme()})});
$$('[data-scheme]').forEach(b=>b.addEventListener('click',()=>{scheme=b.dataset.scheme;store.set('rcp.scheme',scheme);applyTheme()}));
$('#schemeBtn').addEventListener('click',()=>{scheme=scheme==='dark'?'light':'dark';store.set('rcp.scheme',scheme);applyTheme()});

/* ── language ── */
function applyLang(l,save){
  lang=l;S=STR[l];root.lang=l;
  if(save){store.set('rcp.lang',l);const u=new URL(location.href);u.searchParams.set('lang',l);history.replaceState(null,'',u)}
  $$('[data-i18n]').forEach(e=>{const v=S[e.dataset.i18n];if(typeof v==='string')e.textContent=v});
  $$('[data-i18n-html]').forEach(e=>e.innerHTML=S[e.dataset.i18nHtml]);
  $$('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',S[e.dataset.i18nAria]));
  $$('[data-i18n-alt]').forEach(e=>e.alt=S[e.dataset.i18nAlt]);
  $$('img[data-shot]').forEach(e=>e.src=`/about/assets/landing/${l}/${e.dataset.shot}.jpg`);
  document.title=S['meta.title'];const md=$('meta[name="description"]');if(md)md.content=S['meta.desc'];
  $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l));
  applyTheme();renderFaq();renderImpFrom();renderRf();renderPub();renderNu();renderCk();
  play(cur,true);
}
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>applyLang(b.dataset.lang,true)));

/* ── hero: assistant replica ── */
const RP=$('#rp'),log=$('.rp-log',RP),cardsEl=$('.rp-cards',RP),qEl=$('.rp-q',RP);
const RECIPES=[{k:'biryani',img:'photo-biryani.jpg',c:'c.ind',d:'d.med',t:75,ch:1},{k:'pizza',img:'photo-pizza.jpg',c:'c.ita',d:'d.easy',t:35},{k:'bowl',img:'photo-bowl.jpg',c:'c.med',d:'d.easy',t:25,ch:1},{k:'chicken',img:'photo-chicken.jpg',c:'c.tur',d:'d.med',t:90,ch:1}];
let run=0,cur=0,st={q:'',f:false};
function renderList(){
  cardsEl.innerHTML=RECIPES.map(r=>`<div class="rp-card" data-k="${r.k}"><div class="ph" style="background-image:url(/about/assets/landing/${r.img})"><span class="d">${S[r.d]}</span><span class="c">${S[r.c]}</span></div><div class="bd"><b>${S['r.'+r.k]}</b><span>${r.t} ${S['scr.min']}</span></div></div>`).join('');
  applyList();
}
function applyList(){
  let n=0;RECIPES.forEach(r=>{const ok=(!st.q||r.ch)&&(!st.f||r.t<=30);if(ok)n++;$(`[data-k="${r.k}"]`,cardsEl).classList.toggle('out',!ok)});
  $('.rp-count',RP).textContent=fmt(S[n===1?'scr.result':'scr.results'],{n});
  $('.rp-fs',RP).innerHTML=st.f?`<span class="rp-chip f">≤ 30 ${S['scr.min']}</span>`:'';
}
function view(v){$$('.rp-view',RP).forEach(e=>e.classList.toggle('on',e.dataset.v===v))}
function setSt(s){RP.dataset.st=s;$('.rp-stt',RP).textContent=S['a.'+s]}
function msg(kind,text){const d=document.createElement('div');d.className='rp-m '+kind;d.textContent=text;log.appendChild(d);return d}
function act(label,detail){const d=document.createElement('div');d.className='rp-a';d.innerHTML=ico('i-spark')+`<span>${S[label]}</span>`+(detail?`<em>· ${detail}</em>`:'');log.appendChild(d)}
function recipeView(){
  $('[data-v="recipe"]',RP).innerHTML=`<div class="rp-hero" style="background-image:url(/about/assets/landing/photo-pizza.jpg)"></div><div class="rp-h">${S['r.pizza']}</div><div class="rp-meta"><span>${S['c.ita']}</span><span>${S['d.easy']}</span><span>35 ${S['scr.min']}</span><span class="sv">${S['scr.saved']}</span></div><div class="rp-lab">${S['scr.ingredients']} · ${fmt(S['scr.serves'],{n:4})}</div><ul class="rp-ing">${S['pizza.ing'].map(x=>`<li>${x}</li>`).join('')}</ul>`;
}
function draftView(){
  $('[data-v="draft"]',RP).innerHTML=`<div class="rp-dhead"><b>${S['scr.create']}</b><span class="rp-badge">${S['scr.draft']}</span></div><div class="rp-field"><small>${S['scr.name']}</small><div class="rp-dn"></div></div><div class="rp-lab">${S['scr.ingredients']}</div><ul class="rp-ing rp-di"></ul>`;
}
async function play(i,instant){
  const my=++run;cur=i;instant=instant||RM.matches;
  $$('[data-play]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.play===i));
  const W=ms=>instant?Promise.resolve():new Promise((res,rej)=>setTimeout(()=>my===run?res():rej(0),ms));
  const type=async(el,text,ms)=>{if(instant){el.textContent=text;return}el.textContent='';for(const w of text.split(' ')){el.textContent+=(el.textContent?' ':'')+w;await W(ms)}};
  const K='s'+(i+1);
  try{
    st={q:'',f:false};qEl.textContent='';renderList();recipeView();draftView();view('list');
    log.innerHTML='';msg('b',S['a.intro']);setSt('listening');
    await W(500);await type(msg('u',''),S[K+'.user'],150);
    setSt('thinking');await W(700);
    if(i===0){
      act('act.searched',S['s1.q']);
      if(instant)qEl.textContent=S['s1.q'];else for(const ch of S['s1.q']){qEl.textContent+=ch;await W(70)}
      st.q=S['s1.q'];applyList();await W(800);
      act('act.filter',S['s1.f']);st.f=true;applyList();await W(800);
    }else if(i===1){
      act('act.opened',S['r.pizza']);view('recipe');await W(900);
    }else{
      act('act.created');view('draft');await W(600);
      await type($('.rp-dn',RP),S['curry.name'],160);
      for(const x of S['curry.ing']){const li=document.createElement('li');li.textContent=x;$('.rp-di',RP).appendChild(li);await W(240)}
      act('act.filled',S['s3.fill']);await W(500);
    }
    setSt('speaking');await type(msg('b',''),S[K+'.reply'],110);await W(1400);setSt('idle');
  }catch(e){}
}
$$('[data-play]').forEach(b=>b.addEventListener('click',()=>play(+b.dataset.play)));

/* ── import demo ── */
const SRC={tiktok:{url:'https://www.tiktok.com/@mutfaktaki_hayat/video/7291834412',ico:'i-note',bg:'#111'},instagram:{url:'https://www.instagram.com/reel/C8kLm2xR4pQ/',ico:'i-ig',bg:'#E1306C'},youtube:{url:'https://www.youtube.com/watch?v=q3Lr8Vx2kPa',ico:'i-play',bg:'#FF0000'},facebook:{ico:'i-fb',bg:'#1877F2'},pinterest:{ico:'i-pin',bg:'#E60023'},web:{ico:'i-globe',bg:'var(--primary)'}};
const imp=$('#imp'),impUrl=$('#impUrl'),impGo=$('#impGo'),impSteps=$('.imp-steps',imp),impOut=$('.imp-out',imp);
let impState='idle',impJob=0,impSrc='web',impHost='';
function detect(u){const s=u.toLowerCase();if(s.includes('tiktok'))return'tiktok';if(s.includes('instagram'))return'instagram';if(s.includes('youtu'))return'youtube';if(s.includes('facebook')||s.includes('fb.watch'))return'facebook';if(s.includes('pinterest')||s.includes('pin.it'))return'pinterest';return'web'}
function renderImpFrom(){
  impGo.textContent=S[impState==='done'?'imp.again':'imp.btn'];
  if(impState!=='done'){impOut.innerHTML='';return}
  const s=SRC[impSrc],from=impSrc==='web'?fmt(S['imp.from.web'],{host:impHost}):S['imp.from.'+impSrc];
  impOut.innerHTML=`<div class="imp-res"><div class="ph" role="img" aria-label="${S['alt.bowl']}" style="background-image:url(/about/assets/landing/photo-bowl.jpg)"><span>${ico('i-lock')}${S['imp.private']}</span></div><div class="bd"><h3>${S['imp.recipe']}</h3><div class="tags"><span>${S['c.med']}</span><span>${S['d.easy']}</span><span>30 ${S['scr.min']}</span><span>${S['imp.ing']}</span></div><div class="prov"><i style="background:${s.bg}">${ico(s.ico)}</i><span>${from}</span><span class="o">${S['imp.orig']}${ico('i-ext')}</span></div></div></div>`;
}
$$('.src-b',imp).forEach(b=>b.addEventListener('click',()=>{$$('.src-b',imp).forEach(x=>x.setAttribute('aria-pressed',x===b));impUrl.value=SRC[b.dataset.src].url;resetImp()}));
impUrl.addEventListener('input',()=>{$$('.src-b',imp).forEach(x=>x.setAttribute('aria-pressed',detect(impUrl.value)===x.dataset.src));if(impState==='done')resetImp()});
function resetImp(){impJob++;impState='idle';impSteps.hidden=true;$$('li',impSteps).forEach(l=>l.className='');renderImpFrom();impGo.disabled=false}
impGo.addEventListener('click',async()=>{
  if(impState==='done'){resetImp();impUrl.focus();return}
  if(impState==='busy')return;
  if(!impUrl.value.trim())impUrl.value=SRC.tiktok.url;
  impSrc=detect(impUrl.value);try{impHost=new URL(impUrl.value.trim().replace(/^(?!https?:)/,'https://')).hostname.replace(/^www\./,'')}catch(e){impHost=impUrl.value.trim()}
  const my=++impJob;impState='busy';impGo.disabled=true;impSteps.hidden=false;impOut.innerHTML='';
  const lis=$$('li',impSteps);lis.forEach(l=>l.className='');
  for(let k=0;k<lis.length;k++){lis[k].className='live';await new Promise(r=>setTimeout(r,RM.matches?0:900));if(my!==impJob)return;lis[k].className='done'}
  impState='done';impGo.disabled=false;renderImpFrom();
});

/* ── refine demo ── */
const rf=$('#rf');let rfS={veg:0,six:0,pan:0},rfP=null,rfFlash=[];
function recipe(f){
  const six=f.six,tr=lang==='tr';
  if(!tr)return{name:`Lemon Herb ${f.veg?'Chickpea':'Chicken'} ${f.pan?'Skillet':'Traybake'}`,meta:`${fmt(S['cr.serves'],{n:six?6:4})} · ${f.pan?(f.veg?30:40):(f.veg?40:45)} min`,
    ing:[f.veg?`${six?3:2} cans chickpeas, drained`:`${six?6:4} chicken thighs`,`${six?900:600} g baby potatoes`,six?'2 lemons':'1 lemon',`${six?4:3} garlic cloves`,`${six?3:2} tbsp olive oil`,`${six?'1½':'1'} tsp dried oregano`],
    steps:f.pan?['Heat the oil in a large lidded pan.','Cook the potatoes, covered, for 15 minutes.',f.veg?'Add the chickpeas, lemon, garlic and oregano and cook for 10 minutes.':'Add the chicken, lemon, garlic and oregano and cook for 20 minutes, turning once.']
      :['Heat the oven to 220°C.','Toss everything with the oil, lemon and oregano on a tray.',f.veg?'Roast for 35 minutes, turning once.':'Roast for 40 minutes, turning once.']};
  return{name:`${f.pan?'Tavada':'Fırında'} Limonlu ${f.veg?'Nohut':'Tavuk'}`,meta:`${fmt(S['cr.serves'],{n:six?6:4})} · ${f.pan?(f.veg?30:40):(f.veg?40:45)} dk`,
    ing:[f.veg?`${six?3:2} kutu nohut, süzülmüş`:`${six?6:4} adet tavuk but`,`${six?900:600} g bebek patates`,`${six?2:1} limon`,`${six?4:3} diş sarımsak`,`${six?3:2} yemek kaşığı zeytinyağı`,`${six?'1,5':'1'} tatlı kaşığı kekik`],
    steps:f.pan?['Geniş, kapaklı bir tavada zeytinyağını ısıt.','Patatesleri kapağı kapalı 15 dakika pişir.',f.veg?'Nohut, limon, sarımsak ve kekiği ekleyip 10 dakika pişir.':'Tavuk, limon, sarımsak ve kekiği ekleyip bir kez çevirerek 20 dakika pişir.']
      :['Fırını 220°C’ye ısıt.','Hepsini tepside zeytinyağı, limon ve kekikle harmanla.',f.veg?'35 dakika pişir, bir kez çevir.':'40 dakika pişir, bir kez çevir.']};
}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
function renderRf(){
  const r=recipe(rfS),fl=k=>rfFlash.includes(k)?' class="flash"':'';
  $('.rf-r',rf).innerHTML=`<h3${fl('name')}>${esc(r.name)}</h3><div class="tags"><span${fl('meta')}>${esc(r.meta)}</span></div><div class="rf-cols"><div><p class="rf-lab">${S['cr.ingredients']}</p><ul>${r.ing.map((x,i)=>`<li${fl('i'+i)}>${esc(x)}</li>`).join('')}</ul></div><div><p class="rf-lab">${S['cr.steps']}</p><ol>${r.steps.map((x,i)=>`<li${fl('s'+i)}>${esc(x)}</li>`).join('')}</ol></div></div>`;
  $$('[data-rf]',rf).forEach(b=>{const on=!!rfS[b.dataset.rf];b.classList.toggle('done',on);b.setAttribute('aria-disabled',on||!!rfP);b.querySelector('use').setAttribute('href',on?'#i-check':'#i-spark')});
  const pe=$('.rf-prop',rf);
  if(!rfP){pe.innerHTML='';return}
  const a=recipe(rfS),b=recipe(rfP.next),rows=[];
  const cmp=(x,y)=>{if(x!==y)rows.push(`<li class="del">− ${esc(x)}</li><li class="add">+ ${esc(y)}</li>`)};
  cmp(a.name,b.name);cmp(a.meta,b.meta);a.ing.forEach((x,i)=>cmp(x,b.ing[i]));a.steps.forEach((x,i)=>cmp(x,b.steps[i]));
  pe.innerHTML=`<div class="prop"><h4>${ico('i-spark')}${S['cr.prop']} <span>· ${S['cr.chip.'+rfP.k]}</span></h4><ul class="diff">${rows.join('')}</ul><div class="prop-b"><button class="btn btn-p btn-sm" type="button" data-pa="1">${S['cr.apply']}</button><button class="btn btn-g btn-sm" type="button" data-pa="0">${S['cr.discard']}</button></div></div>`;
}
rf.addEventListener('click',e=>{
  const c=e.target.closest('[data-rf]'),pa=e.target.closest('[data-pa]');
  if(c&&!rfS[c.dataset.rf]&&!rfP){rfP={k:c.dataset.rf,next:{...rfS,[c.dataset.rf]:1}};rfFlash=[];renderRf();const ab=$('[data-pa="1"]',rf);ab&&ab.focus()}
  if(pa){
    if(pa.dataset.pa==='1'){const a=recipe(rfS),b=recipe(rfP.next);rfFlash=[];if(a.name!==b.name)rfFlash.push('name');if(a.meta!==b.meta)rfFlash.push('meta');a.ing.forEach((x,i)=>{if(x!==b.ing[i])rfFlash.push('i'+i)});a.steps.forEach((x,i)=>{if(x!==b.steps[i])rfFlash.push('s'+i)});rfS=rfP.next}
    const k=rfP.k;rfP=null;renderRf();$(`[data-rf="${k}"]`,rf).focus();
  }
});
$('#rfReset').addEventListener('click',()=>{rfS={veg:0,six:0,pan:0};rfP=null;rfFlash=[];renderRf()});

/* ── publish mini-demo ── */
let published=false;
function renderPub(){
  const tx=$('#pub .tx');
  tx.innerHTML=`<b>${S['r.pizza']}</b><span class="pill ${published?'pb':'pv'}">${ico(published?'i-check':'i-lock')}<span>${S[published?'cb.published':'cb.private']}</span></span><small>${S[published?'cb.live':'cb.only']}</small>`;
  const b=$('#pubBtn');b.textContent=S[published?'cb.reset':'cb.publish'];b.className='btn btn-sm '+(published?'btn-g':'btn-p');
}
$('#pubBtn').addEventListener('click',()=>{published=!published;renderPub()});

/* ── nutrition ── */
const NU={en:{g:{kcal:143,m:[[6.7,13],[18,7],[4.8,7],[1,3]]},s:{kcal:300,m:[[14.1,28],[37.8,14],[10.1,14],[2.1,7]]}},
          tr:{g:{kcal:72,m:[[4,8],[10,4],[2,3],[2.8,10]]},s:{kcal:180,m:[[10,20],[26,9],[5,7],[7,23]]}}};
const MC=['var(--primary)','#F59E0B','#EF4444','#10B981'],MK=['nu.p','nu.c','nu.f','nu.fi'];
let basis='g';
function renderNu(){
  const d=NU[lang][basis],nu=$('#nu');
  $('.nu-kcal',nu).textContent=d.kcal;
  $('.nu-per',nu).textContent=S[basis==='g'?'nu.per100':'nu.perServ'];
  $('.nu-line',nu).textContent=S[basis==='g'?'nu.line100':'nu.lineServ'];
  $('.ring',nu).style.setProperty('--p',Math.min(1,d.kcal/2000*4).toFixed(3));
  $('.macros',nu).innerHTML=d.m.map(([v,dv],i)=>`<div class="mac" style="--mc:${MC[i]}"><b>${num(v)}<i>g</i></b><span>${S[MK[i]]}</span><u><s style="width:${Math.min(100,dv*2.5)}%"></s></u><small>${fmt(S['nu.dv'],{n:dv})}</small></div>`).join('');
  $$('.nseg button',nu).forEach(b=>{const on=b.dataset.basis===basis;b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1});
}
const seg=$('#nu .nseg');
seg.addEventListener('click',e=>{const b=e.target.closest('button');if(b){basis=b.dataset.basis;renderNu()}});
seg.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();basis=basis==='g'?'s':'g';renderNu();$(`[data-basis="${basis}"]`,seg).focus()}});

/* ── cooking + timers ── */
const DUR=[60,480,720,1200],T={},ck=$('#ck');let step=0,notifT=0;
const mmss=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function chipHtml(i){const t=T[i],now=Date.now();
  if(t&&t.done)return{c:'tchip fin',h:ico('i-check')+S['ck.done']};
  if(t)return{c:'tchip run',h:ico('i-clock')+mmss((t.end-now)/1000)};
  return{c:'tchip',h:ico('i-clock')+fmt(S['ck.start'],{t:mmss(DUR[i])})};}
function renderCk(){
  const n=S['ck.steps'].length;
  $('.ck-of',ck).textContent=fmt(S['ck.stepOf'],{n:step+1,m:n});
  $('.ck-pr s',ck).style.width=((step+1)/n*100)+'%';
  $('.ck-n',ck).textContent=step+1;$('.ck-t',ck).textContent=S['ck.steps'][step];
  $('#ckBack').disabled=step===0;$('#ckNext').disabled=step===n-1;
  tickCk();
}
function tickCk(){
  const now=Date.now(),c=chipHtml(step),chip=$('.tchip',ck);chip.className=c.c;chip.innerHTML=c.h;
  const run=Object.keys(T).filter(i=>!T[i].done);
  $('.tbar ul',ck).innerHTML=run.map(i=>`<li><span>${S['ck.labels'][i]}</span><time>${mmss((T[i].end-now)/1000)}</time><button type="button" data-cancel="${i}" aria-label="${S['ck.cancel']}: ${S['ck.labels'][i]}">${ico('i-x')}</button></li>`).join('');
  $('.tbar-e',ck).hidden=run.length>0;
}
$('.tchip',ck).addEventListener('click',()=>{const t=T[step];if(t&&!t.done)return;T[step]={end:Date.now()+DUR[step]*1000};tickCk()});
ck.addEventListener('click',e=>{const x=e.target.closest('[data-cancel]');if(x){delete T[x.dataset.cancel];tickCk()}});
$('#ckBack').addEventListener('click',()=>{if(step>0){step--;renderCk()}});
$('#ckNext').addEventListener('click',()=>{if(step<S['ck.steps'].length-1){step++;renderCk()}});
setInterval(()=>{const now=Date.now();let chg=false;
  Object.keys(T).forEach(i=>{const t=T[i];if(!t.done&&now>=t.end){t.done=true;chg=true;const nf=$('.notif',ck);$('.notif-t',nf).textContent=S['ck.labels'][i];nf.classList.add('on');clearTimeout(notifT);notifT=setTimeout(()=>nf.classList.remove('on'),6000)}});
  if(Object.keys(T).length||chg)tickCk();},500);

/* ── FAQ ── */
function renderFaq(){
  const l=$('.faq-l'),open=$$('details',l).map(d=>d.open);
  l.innerHTML=S.faq.map(([q,a],i)=>`<details${open[i]?' open':''}><summary><span>${q}</span>${ico('i-plus')}</summary><p>${a}</p></details>`).join('');
}

/* ── reveal on scroll ── */
if('IntersectionObserver' in window&&!RM.matches){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(e=>io.observe(e));
}else $$('.rv').forEach(e=>e.classList.add('in'));

/* ── boot: ?lang= wins, then a saved choice, then the first of the browser's languages the page speaks ── */
const qp=new URLSearchParams(location.search).get('lang');
const nav=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en']);
const first=nav.map(l=>String(l).slice(0,2).toLowerCase()).find(l=>l==='tr'||l==='en');
lang=(qp==='tr'||qp==='en')?qp:(store.get('rcp.lang')||first||'en');
if(!STR[lang])lang='en';
theme=PAL[store.get('rcp.theme')]?store.get('rcp.theme'):'pearl-white';
scheme=store.get('rcp.scheme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
cur=0;applyLang(lang,false);
if(!RM.matches)setTimeout(()=>play(0),700);
})();
