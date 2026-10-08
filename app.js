'use strict';
let media=[],currentList=[],currentIndex=0,activeDay='all',opener=null;
const $=s=>document.querySelector(s);
const viewer=$('#lightbox');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let storedMotion=null;try{storedMotion=localStorage.getItem('ryu-motion')}catch{}
let noMotion=storedMotion==='off'||(storedMotion!=='on'&&reduced.matches);
function motionUI(){document.body.classList.toggle('no-motion',noMotion);$('#motion').textContent=noMotion?'모션 ON':'모션 OFF';$('#motion').setAttribute('aria-pressed',String(noMotion));$('#motion').setAttribute('aria-label',noMotion?'움직임 켜기':'움직임 줄이기')}
motionUI();$('#motion').onclick=()=>{noMotion=!noMotion;try{localStorage.setItem('ryu-motion',noMotion?'off':'on')}catch{}motionUI();tick()};
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
let ticking=false;
function tick(){const y=window.scrollY,total=document.documentElement.scrollHeight-innerHeight;$('.progress').style.transform=`scaleX(${total>0?y/total:0})`;if(!noMotion&&!reduced.matches&&innerWidth>650){document.querySelectorAll('[data-parallax]').forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){const ratio=(innerHeight/2-(r.top+r.height/2))/innerHeight;el.querySelector('.scene').style.transform=`translateY(${Math.max(-12,Math.min(0,-6+ratio*10))}%)`}})}ticking=false}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(tick);ticking=true}},{passive:true});addEventListener('resize',tick);tick();
function photoCard(r,rail=false){return `<button class="${rail?'rail-card':'wall-item'}" data-open="${r.id}" aria-label="${escapeHTML(r.caption)} 크게 보기"><img src="${r.thumb}" width="${r.width}" height="${r.height}" loading="lazy" decoding="async" alt="${escapeHTML(r.caption)}"><span>${rail?escapeHTML(r.caption):'사진 '+r.id.replace(/^p/,'')+' ↗'}</span></button>`}
function renderWall(){const photos=media.filter(r=>r.type==='photo'&&(activeDay==='all'||r.day===activeDay));$('#wall').innerHTML=photos.map(r=>photoCard(r)).join('');$('#archiveCount').textContent=`${photos.length}장의 사진 · 눌러서 크게 보기`;document.querySelectorAll('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.day===activeDay)))}
function showMedia(){const r=currentList[currentIndex];$('#viewerMedia').replaceChildren();let el;
 if(r.type==='video'){el=document.createElement('video');el.controls=true;el.playsInline=true;el.preload='metadata';el.muted=true;el.poster=r.thumb;el.src=r.src;el.setAttribute('aria-label',r.caption)}else{el=document.createElement('img');el.src=r.src;el.alt=r.caption;el.decoding='async'}
 $('#viewerMedia').append(el);$('#viewerLabel').textContent=r.type==='video'?'MOMENTS IN MOTION / 무음 영상':'FAMILY PHOTO ARCHIVE';$('#viewerCaption').textContent=r.caption;$('#viewerPosition').textContent=`${currentIndex+1} / ${currentList.length}`;$('#prevMedia').disabled=currentList.length<2;$('#nextMedia').disabled=currentList.length<2;
}
function openMedia(id,button){const r=media.find(x=>x.id===id);if(!r)return;opener=button;currentList=r.type==='video'?media.filter(x=>x.type==='video'):media.filter(x=>x.type==='photo'&&(activeDay==='all'||x.day===activeDay));if(!currentList.some(x=>x.id===id))currentList=media.filter(x=>x.type==='photo');currentIndex=currentList.findIndex(x=>x.id===id);showMedia();viewer.showModal();document.body.style.overflow='hidden';$('#closeViewer').focus()}
function step(dir){currentIndex=(currentIndex+dir+currentList.length)%currentList.length;showMedia()}
function closeViewer(){viewer.close()}
$('#closeViewer').onclick=closeViewer;$('#prevMedia').onclick=()=>step(-1);$('#nextMedia').onclick=()=>step(1);
viewer.addEventListener('close',()=>{const video=viewer.querySelector('video');if(video)video.pause();$('#viewerMedia').replaceChildren();document.body.style.overflow='';if(opener&&opener.isConnected)opener.focus()});
addEventListener('keydown',e=>{if(!viewer.open)return;if(e.key==='ArrowRight'){e.preventDefault();step(1)}if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}});
let touchX=null;$('#viewerMedia').addEventListener('touchstart',e=>{if(e.target.tagName!=='VIDEO')touchX=e.changedTouches[0].clientX},{passive:true});$('#viewerMedia').addEventListener('touchend',e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(dx)>65)step(dx<0?1:-1)},{passive:true});
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openMedia(b.dataset.open,b);const filter=e.target.closest('[data-day]');if(filter){activeDay=filter.dataset.day;renderWall()}});
$('#railPrev').onclick=()=>$('#rail').scrollBy({left:-330,behavior:noMotion?'instant':'smooth'});$('#railNext').onclick=()=>$('#rail').scrollBy({left:330,behavior:noMotion?'instant':'smooth'});
async function init(){try{const response=await fetch('media.json');if(!response.ok)throw Error('앨범 데이터 로드 실패');media=await response.json();renderWall();const highlights=['p043','p055','p067','p095','p096','p104','p138','p149','x001','x002','x003','x004'];$('#rail').innerHTML=highlights.map(id=>media.find(r=>r.id===id)).filter(Boolean).map(r=>photoCard(r,true)).join('');$('#filmRail').innerHTML=media.filter(r=>r.type==='video').map(r=>`<button class="film-card" data-open="${r.id}" aria-label="${escapeHTML(r.caption)} 재생"><div class="film-poster"><img src="${r.thumb}" alt="${escapeHTML(r.caption)}" width="700" height="450" loading="lazy"><span class="play" aria-hidden="true">▶</span><span class="duration">${Math.floor(r.duration/60)}:${String(r.duration%60).padStart(2,'0')}</span></div><h3>${escapeHTML(r.caption)}</h3></button>`).join('');document.documentElement.dataset.ready='true';tick()}catch(e){$('#archiveCount').textContent='앨범을 불러오지 못했습니다. 새로고침해 주세요.';console.error(e)}}
init();
