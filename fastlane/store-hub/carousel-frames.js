// Recipely store screenshots — real captures, honest claims (no ratings/reviews).
const SHOT={
  recipes:'assets/screens/screen-recipes.png',
  create:'assets/screens/screen-create.png',
  recipe:'assets/screens/screen-recipe.png',
  myrecipes:'assets/screens/screen-myrecipes.png',
  profile:'assets/screens/screen-profile.png',
};
const L=(en,tr)=>`<span class="en">${en}</span><span class="tr">${tr}</span>`;
// The band above the capture is an EMPTY spacer — never a drawn status bar.
// App Review rejected 1.0.43 (694) under guideline 2.3.10 for "non-iOS status bar
// images": the old export drew 9:41 + 5G + a battery in the app's own webfont, with
// no signal or wifi glyph and in the wrong order for iOS, painted straight over the
// back button and the bookmark icon. A status bar that is drawn rather than captured
// can only ever be wrong, so this draws none. Real device chrome (the island) stays.
const sysbar=dark=>`<div class="sysbar${dark?' dk':''}"></div>`;


function frame({eyebrow,hl,sub,shot,art,dark=false}){
  const media=art||`<div class="phonewrap"><div class="phone"><div class="screen">${sysbar(dark)}<img class="shot" src="${shot}" alt=""/></div><div class="island"></div><div class="hole"></div></div></div>`;
  return `<div class="frame">
  <span class="eyebrow"><i></i>${eyebrow}</span>
  <h1 class="headline">${hl}</h1>
  <p class="sub">${sub}</p>
  ${media}
</div>`;
}

// crop(x,y,w,h) — a real pixel region of a 390-wide capture, scaled up S×
const S=3.6;
const crop=(src,y,h,Z=1)=>`<div class="crop" style="height:calc(var(--sw) * ${(h*Z/390).toFixed(4)});background-image:url(${src});background-size:${(100*Z).toFixed(2)}% auto;background-position:${(-(Z-1)*50).toFixed(2)}% calc(var(--sw) * ${(-y*Z/390).toFixed(4)})"></div>`;

const phone=(inner,dark=false)=>`<div class="phonewrap"><div class="phone"><div class="screen">${sysbar(dark)}${inner}</div><div class="island"></div><div class="hole"></div></div></div>`;

// Frame 1 — designed mock of the Instagram-import flow (concept UI, not a capture)
const artInstagram=phone(`<div class="mock import">
  <div class="im-badge">
    <span class="im-arc"></span>
    <span class="im-dot d1"></span><span class="im-dot d2"></span><span class="im-dot d3"></span>
    <span class="im-tile"><img src="assets/images/icon.png" alt=""/></span>
  </div>
  <div class="im-title">${L('Turning the reel into a recipe','Reel tarife dönüştürülüyor')}</div>
  <div class="im-sub">${L('This can take a minute or two — the chef is working.','Bu bir iki dakika sürebilir — şef çalışırken biraz bekle.')}</div>
  <div class="im-steps">
    <div class="im-step done"><i></i>${L('Downloading video','Video indiriliyor')}</div>
    <div class="im-step done"><i></i>${L('Transcribing audio','Ses yazıya dökülüyor')}</div>
    <div class="im-step done"><i></i>${L('Reading the recipe','Tarif okunuyor')}</div>
    <div class="im-step live"><i></i>${L('Writing the recipe','Tarif yazılıyor')}</div>
  </div>
  <div class="im-bar"><b></b></div>
</div>`);

// Frame 5 — My Recipes rebuilt in the app's Pearl White tokens, real recipes + real photos
const bkCard=(photo,title,diff,cuisine,tags,likes,rating,views)=>`<div class="bk2-card">
  <div class="bk2-photo"><img src="${photo}" alt=""/>
    <span class="bk2-diff">${diff}</span><span class="bk2-cui">${cuisine}</span><span class="bk2-like">♡ ${likes}</span></div>
  <div class="bk2-meta"><div class="bk2-title">${title}</div>
    <div class="bk2-row"><span class="bk2-tags">${tags.map(t=>'<i>'+t+'</i>').join('')}</span>
      <span class="bk2-stats">★ ${rating} &nbsp;◎ ${views}</span></div></div>
</div>`;

const artCookbook=phone(`<div class="mock bk2">
  <div class="bk2-head">
    <div class="bk2-h1">${L('My Recipes','Tariflerim')}</div>
    <div class="bk2-cta">+ ${L('Create new recipe','Yeni tarif oluştur')}</div>
    <div class="bk2-tabs"><span class="on">${L('Saved','Kaydedilen')} <b>3</b></span><span>${L('Created','Oluşturulan')} <b>0</b></span><span>${L('Drafts','Taslak')} <b>7</b></span></div>
  </div>
  ${bkCard('assets/screens/photo-biryani.png','Chicken Biryani','Medium','Indian',['Rice','Main course'],945,'4.8','12K')}
  ${bkCard('assets/screens/photo-risotto.png','Mushroom Risotto','Hard','Italian',['Rice','Vegetarian'],367,'4.6','5.9K')}
</div>`);

window.FRAMES=[
  frame({art:artInstagram,
    eyebrow:L('Instagram import','Instagram’dan içe aktar'),
    hl:L('Share a reel —<br><span class="hl">get the recipe.</span>','Reel’i paylaş —<br><span class="hl">tarifi al.</span>'),
    sub:L('Audio and video analysed into ingredients and steps.','Ses ve görüntü analiz edilir, tarif yazılır.')}),
  frame({shot:SHOT.recipes,eyebrow:L('Browse','Keşfet'),
    hl:L('Every recipe,<br><span class="hl">in one place.</span>','Tüm tarifler<br><span class="hl">tek bir yerde.</span>'),
    sub:L('Browse by cuisine and find a dish in seconds.','Mutfağa göre gez, saniyeler içinde bul.')}),
  frame({shot:SHOT.create,eyebrow:L('AI recipes','AI ile tarif'),
    hl:L('Describe it —<br><span class="hl">AI writes the recipe.</span>','Anlat yeter —<br><span class="hl">tarifi AI yazsın.</span>'),
    sub:L('Say what you want or what you have. Edit it by chatting.','Ne istediğini ya da neyin var yaz. Konuşarak düzenle.')}),
  frame({shot:SHOT.recipe,dark:true,eyebrow:L('Nutrition','Besin değerleri'),
    hl:L('Know exactly<br><span class="hl">what you cook.</span>','Ne pişirdiğini<br><span class="hl">tam olarak bil.</span>'),
    sub:L('Times, servings, difficulty and macros per serving.','Süre, porsiyon, zorluk ve makrolar.')}),
  frame({art:artCookbook,
    eyebrow:L('My Recipes','Tariflerim'),
    hl:L('Your cookbook,<br><span class="hl">always with you.</span>','Yemek kitabın<br><span class="hl">her zaman yanında.</span>'),
    sub:L('Saved, created and drafts, all in one place.','Kaydedilen, oluşturulan ve taslaklar tek yerde.')}),
  frame({shot:SHOT.profile,eyebrow:L('Themes & languages','Tema ve dil'),
    hl:L('Made<br><span class="hl">exactly yours.</span>','Tamamen<br><span class="hl">sana göre.</span>'),
    sub:L('Themes, dark or light, English or Turkish.','Temalar, koyu ya da açık, İngilizce ya da Türkçe.')}),
];
