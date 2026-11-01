'use strict';
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(){
  menuButton.setAttribute('aria-expanded','false');
  menuButton.textContent = 'メニュー';
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click',()=>{
  const opened = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded',String(opened));
  menuButton.textContent = opened ? '閉じる' : 'メニュー';
  navigation.classList.toggle('is-open',opened);
});
navigation.addEventListener('click',event=>{if(event.target.closest('a')) closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
window.matchMedia('(min-width:901px)').addEventListener('change',closeMenu);
const imageDialog = document.querySelector('#image-dialog');
if (imageDialog && typeof imageDialog.showModal === 'function') {
  const dialogImage = imageDialog.querySelector('.dialog-image');
  const dialogTitle = imageDialog.querySelector('#image-dialog-title');
  let imageOpener = null;
  document.querySelectorAll('.image-link').forEach(link=>{
    link.addEventListener('click', event=>{
      if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      imageOpener = link;
      dialogImage.src = link.href;
      dialogImage.alt = link.querySelector('img')?.alt || link.dataset.alt || link.dataset.caption;
      dialogTitle.textContent = link.dataset.caption;
      imageDialog.showModal();
      document.body.classList.add('dialog-open');
    });
  });
  imageDialog.querySelector('.dialog-close').addEventListener('click',()=>imageDialog.close());
  imageDialog.addEventListener('click', event=>{
    if(event.target !== imageDialog) return;
    const rect = imageDialog.getBoundingClientRect();
    if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) imageDialog.close();
  });
  imageDialog.addEventListener('close',()=>{
    document.body.classList.remove('dialog-open');
    if(imageOpener) imageOpener.focus({preventScroll:true});
  });
}

/* ---- R2 detection demo ---- */
(()=>{
  const demo=document.querySelector('.detect-demo');
  if(!demo) return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const capStep=demo.querySelector('.dd-cap-step'),capText=demo.querySelector('.dd-cap-text');
  const steps={1:['STEP 1 検出','カメラ画像からボールを見つける'],2:['STEP 2 判断','赤＝籾は回収、紫＝空籾は除外'],3:['STEP 3 動作','籾を回収して、サイロへ貯蔵する']};
  let timers=[],playing=false;
  const set=n=>{demo.classList.remove('s1','s2','s3');if(n){demo.classList.add('s'+n);capStep.textContent=steps[n][0];capText.textContent=steps[n][1];}};
  function play(){
    if(playing) return;
    timers.forEach(clearTimeout);timers=[];
    demo.classList.add('is-on');
    if(reduce){set(3);return;}
    playing=true;set(0);void demo.offsetWidth;set(1);
    timers.push(setTimeout(()=>set(2),3000));
    timers.push(setTimeout(()=>set(3),6000));
    timers.push(setTimeout(()=>{playing=false;},9000));
  }
  const link=demo.closest('a');
  link.addEventListener('mouseenter',play);
  link.addEventListener('focus',play);
  document.querySelector('.dd-replay')?.addEventListener('click',()=>{playing=false;play();});
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){play();io.disconnect();}});},{threshold:.6});
    io.observe(link);
  }
})();

/* ---- Runaway robot (emergency stop) ---- */
(()=>{
  const bot=document.querySelector('.runaway-bot');
  const bubble=document.querySelector('.runaway-bubble');
  if(!bot||!bubble) return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size=()=>({w:bot.offsetWidth||72,h:bot.offsetHeight||60});
  let x=16,y=0,tx=0,ty=0,running=!reduce,last=0,raf=0,hinted=false;
  const speed=()=>window.innerWidth<600?70:100;
  function bounds(){const {w,h}=size();return{minX:12,maxX:window.innerWidth-w-12,minY:window.innerHeight-h-110,maxY:window.innerHeight-h-14};}
  function pick(){const b=bounds();tx=b.minX+Math.random()*(b.maxX-b.minX);ty=b.minY+Math.random()*(b.maxY-b.minY);bot.classList.toggle('flip',tx<x);}
  function place(){bot.style.transform=`translate(${x}px,${y}px)`;if(!bubble.hidden) placeBubble();}
  function placeBubble(){
    const bw=bubble.offsetWidth,bh=bubble.offsetHeight,{w}=size();
    const bx=Math.min(Math.max(8,x+w/2-bw/2),window.innerWidth-bw-8);
    bubble.style.transform=`translate(${bx}px,${y-bh-10}px)`;
  }
  function clampNow(){const b=bounds();x=Math.min(Math.max(x,b.minX),b.maxX);y=Math.min(Math.max(y,b.minY),b.maxY);}
  function tick(t){
    const dt=Math.min(.05,(t-last)/1000||0);last=t;
    if(running && !document.hidden){
      const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy),step=speed()*dt;
      if(d<=step){x=tx;y=ty;pick();} else {x+=dx/d*step;y+=dy/d*step;}
      place();
    }
    raf=requestAnimationFrame(tick);
  }
  let shownAt=0;
  function show(html,cls){bubble.className='runaway-bubble'+(cls?' '+cls:'');bubble.innerHTML=html;bubble.hidden=false;shownAt=window.scrollY;placeBubble();}
  window.addEventListener('scroll',()=>{if(!bubble.hidden && Math.abs(window.scrollY-shownAt)>240) hide();},{passive:true});
  function hide(){bubble.hidden=true;}
  function start(){
    running=!reduce;bot.classList.remove('stopped');bot.classList.toggle('moving',running);hide();pick();
    bot.setAttribute('aria-label','走り回るロボットの非常停止ボタンを押す');
  }
  function stop(){
    running=false;bot.classList.remove('moving');bot.classList.add('stopped');
    bot.setAttribute('aria-label','非常停止中のロボット');
    show('<b>非常停止！</b>暴走ロボットを止めました。<br>このアイデアを3Dゲームとして開発中です。<span class="rb-actions"><a href="#game">ゲームを見る</a><button type="button" data-act="restart">再起動</button><button type="button" data-act="park">片付ける</button></span>');
  }
  bot.addEventListener('click',()=>{bot.classList.contains('stopped')?start():stop();});
  bubble.addEventListener('click',e=>{
    const act=e.target.closest('[data-act]')?.dataset.act;
    if(e.target.closest('a')) hide();
    if(act==='restart') start();
    if(act==='park'){document.querySelector('.runaway').hidden=true;cancelAnimationFrame(raf);}
  });
  window.addEventListener('resize',()=>{clampNow();if(running) pick();place();});
  const b=bounds();y=b.maxY;x=reduce?b.maxX:b.minX;place();start();
  raf=requestAnimationFrame(tick);
  setTimeout(()=>{if(!hinted && !bot.classList.contains('stopped')){hinted=true;show('ロボットが暴走中…！ クリックで非常停止','hint');setTimeout(()=>{if(bubble.classList.contains('hint')) hide();},4500);}},2500);
})();
