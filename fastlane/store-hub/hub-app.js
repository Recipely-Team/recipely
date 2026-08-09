/* Recipely Listing Hub — controller. */
const P={
  apple:  {w:1290,h:2796,sw:856,phpad:22,phrad:104,hl:104,sub:46,pt:118,px:80,brand:96},
  android:{w:1080,h:1920,sw:580,phpad:15,phrad:68,hl:72,sub:32,pt:54,px:60,brand:62}
};
let curPlat='apple';
const $=s=>document.querySelector(s);
const rootStyle=document.documentElement.style;
const strip=$('#strip');

function render(){
  strip.querySelectorAll('.frame').forEach(f=>f.remove());
  FRAMES.forEach((f,i)=>{strip.insertAdjacentHTML('beforeend',f);strip.lastElementChild.style.setProperty('--i',i);});
}
render();

function setPlatform(k){
  const p=P[k];curPlat=k;
  rootStyle.setProperty('--fw',p.w+'px');rootStyle.setProperty('--fh',p.h+'px');
  rootStyle.setProperty('--panow',(FRAMES.length*p.w)+'px');
  ['sw','phpad','phrad','hl','sub','pt','px','brand'].forEach(key=>rootStyle.setProperty('--'+key,p[key]+'px'));
  document.body.classList.toggle('platform-apple',k==='apple');
  document.body.classList.toggle('platform-android',k==='android');
  $('#dimTag').textContent=p.w+' × '+p.h;
  $('#dimHint').textContent=p.w+'×'+p.h;
  const idl=$('#iconDim');if(idl)idl.textContent=(k==='apple'?'1024 × 1024':'512 × 512')+' · PNG';
  fitCarousel();
  requestAnimationFrame(()=>{fitGraphics();requestAnimationFrame(fitGraphics);});
  setTimeout(fitGraphics,80);setTimeout(fitGraphics,400);
}

const BAND=560;
function fitCarousel(){
  const p=P[curPlat],sc=BAND/p.h,ss=$('#stripscale');
  ss.style.transform='scale('+sc+')';
  ss.style.width=(FRAMES.length*p.w*sc)+'px';
  ss.style.height=(p.h*sc)+'px';
}

function fitGraphics(){
  const iconWrap=$('#iconscale').parentElement;
  const iw=Math.min(iconWrap.clientWidth,340);
  if(iw>0){const isc=iw/512;$('#iconscale').style.transform='scale('+isc+')';
    $('#iconscale').style.width=(512*isc)+'px';$('#iconscale').style.height=(512*isc)+'px';}
  const fs=$('#featscale');const featCard=$('#feat').closest('.gcard');
  const w=fs?fs.clientWidth:0;
  if(w>0&&featCard&&featCard.offsetParent!==null){const fsc=Math.min(1,w/1024);
    $('#feat').style.transform='scale('+fsc+')';
    fs.style.height=(500*fsc)+'px';}
}

/* ── forms ── */
const FIELDS=['playName','playShort','playFull','appName','appSubtitle','appPromo','appDesc'];
function fillForms(){
  const lang=document.body.classList.contains('lang-tr')?'tr':'en';
  FIELDS.forEach(id=>{const el=$('#'+id);if(el){el.value=COPY[lang][id];}});
  updateCounters();
}
function updateCounters(){
  document.querySelectorAll('.cc').forEach(c=>{
    const el=$('#'+c.dataset.for);if(!el)return;
    const n=el.value.length,max=+c.dataset.max;
    c.textContent=n+'/'+max;c.classList.toggle('over',n>max);
  });
}
document.querySelectorAll('.field input,.field textarea').forEach(el=>el.addEventListener('input',updateCounters));
document.querySelectorAll('.copybtn').forEach(b=>b.addEventListener('click',()=>{
  const el=$('#'+b.dataset.copy);el.select();navigator.clipboard&&navigator.clipboard.writeText(el.value);
  const t=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=t,1200);
}));

/* ── toggles ── */
$('#langSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('#langSeg button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  document.body.classList.remove('lang-en','lang-tr');document.body.classList.add('lang-'+b.dataset.lang);
  fillForms();});
$('#platSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('#platSeg button').forEach(x=>x.classList.remove('on'));b.classList.add('on');setPlatform(b.dataset.plat);});

/* ── export ── */
/* Inline the webfonts as data URIs once; html-to-image can't read the cross-origin
   Google stylesheet, which is why exports fell back to a serif face. */
let FONTCSS=null;
async function fontCSS(){
  if(FONTCSS!==null)return FONTCSS;
  let css='';
  try{
    const hrefs=[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.href).filter(h=>h.includes('fonts.googleapis.com'));
    for(const href of hrefs){
      let t=await (await fetch(href)).text();
      for(const u of [...new Set(t.match(/https:\/\/fonts\.gstatic\.com[^)'"]+/g)||[])]){
        const b=await (await fetch(u)).blob();
        const d=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b);});
        t=t.split(u).join(d);
      }
      css+=t+'\n';
    }
  }catch(err){css='';}
  FONTCSS=css;return css;
}
async function shot(node,w,h,bg){
  if(document.fonts&&document.fonts.ready)await document.fonts.ready;
  const nw=node.offsetWidth||w,nh=node.offsetHeight||h;
  const sx=w/nw,sy=h/nh;
  const opts={width:w,height:h,pixelRatio:1,cacheBust:true,backgroundColor:bg,fontEmbedCSS:await fontCSS()};
  if(Math.abs(sx-1)>0.002||Math.abs(sy-1)>0.002){
    opts.style={transform:`scale(${sx},${sy})`,transformOrigin:'top left'};
  }
  const canvas=await htmlToImage.toCanvas(node,opts);
  const out=document.createElement('canvas');out.width=w;out.height=h;
  const ctx=out.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.drawImage(canvas,0,0,w,h);
  return out.toDataURL('image/png');
}
function dl(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}

$('#exportBtn').addEventListener('click',async e=>{
  const btn=e.currentTarget;btn.disabled=true;
  const frames=[...strip.querySelectorAll('.frame')];const p=P[curPlat];
  const lang=document.body.classList.contains('lang-tr')?'tr':'en';
  const ss=$('#stripscale');const prevTf=ss.style.transform;
  ss.style.transform='none';
  await new Promise(r=>requestAnimationFrame(r));
  try{
    for(let i=0;i<frames.length;i++){
      btn.textContent=`Exporting ${i+1}/${frames.length}…`;
      const url=await shot(frames[i],p.w,p.h,'#1E4FD6');
      dl(url,`recipely-${curPlat}-${lang}-${String(i+1).padStart(2,'0')}.png`);
      await new Promise(r=>setTimeout(r,450));
    }
  }catch(err){alert('Export failed: '+((err&&err.message)||err&&err.type||'unknown'));}
  ss.style.transform=prevTf;
  btn.disabled=false;btn.textContent='⬇ Export '+FRAMES.length+' Screenshots (PNG)';fitCarousel();
});

async function exportFixed(node,w,h,bg,name,btn){
  const t=btn.textContent;btn.disabled=true;btn.textContent='Rendering…';
  const par=node.parentElement;
  const pn=node.style.transform,pp=par.style.transform;
  node.style.transform='none';par.style.transform='none';
  await new Promise(r=>requestAnimationFrame(r));
  try{dl(await shot(node,w,h,bg),name);}catch(err){alert('Export failed: '+((err&&err.message)||err&&err.type||'unknown'));}
  node.style.transform=pn;par.style.transform=pp;
  btn.disabled=false;btn.textContent=t;fitGraphics();
}
$('#dlIcon').addEventListener('click',async e=>{
  const size=curPlat==='apple'?1024:512;
  const ic=$('#icon');ic.classList.add('exporting');
  await exportFixed(ic,size,size,'#FFFFFF','recipely-icon-'+size+'.png',e.currentTarget);
  ic.classList.remove('exporting');
});
$('#dlFeat').addEventListener('click',e=>{const lang=document.body.classList.contains('lang-tr')?'tr':'en';
  exportFixed($('#feat'),1024,500,'#1B47CC','recipely-feature-'+lang+'-1024x500.png',e.currentTarget);});

window.addEventListener('resize',()=>{fitCarousel();fitGraphics();});if(window.ResizeObserver){new ResizeObserver(()=>fitGraphics()).observe($('.gfxgrid'));}
setPlatform('apple');
fitGraphics();
fillForms();
window.addEventListener('load',fitGraphics);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitGraphics);
