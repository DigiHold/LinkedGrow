/*
 * The header's own behaviour, split out of the landing script.
 *
 * Two blocks only: the mobile drawer, and the nav state with the reading
 * progress bar. The rest of the prototype's script belongs to the home and
 * would throw here, because the elements it reaches for do not exist on an
 * inner page.
 *
 * Every element lookup is guarded for the same reason. A standalone HTML file
 * could assume its own markup; a shared component cannot.
 */

export function initV3Chrome() {
  const listeners = [];
  const observers = [];
  const frames = [];
  const on = (target, type, handler, opts) => {
    if (!target) return;
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler]);
  };
  const raf = (fn) => {
    const id = requestAnimationFrame(fn);
    frames.push(id);
    return id;
  };
  // The lifted word-splitter registers its own observer through this, exactly
  // as it did in the landing script it came from.
  const track = (obs) => {
    observers.push(obs);
    return obs;
  };

/* ── menu mobile ── */
  (function(){var b=document.getElementById('burger'),m=document.getElementById('mob');
 if(!b||!m) return;
   b.onclick=function(){m.classList.toggle('on');};
   m.querySelectorAll('a').forEach(function(a){a.onclick=function(){m.classList.remove('on');};});})();

/* ── état de la nav + barre de progression ── */
  (function(){var h=document.getElementById('nh'),p=document.getElementById('prog');
 if(!h||!p) return;
   // The prototype only ever sat on a dark hero, so unscrolled meant "over
   // dark". An inner page starts on white, and there the light state is the
   // right one from the first pixel.
   var overDark=!!document.querySelector('.v3-chrome.on-dark');
   /* Only `fx` is toggled. The logo used to get its own classes here and React
      restored them on the next render, so both of its states hang off `fx`. */
   function u(){var on=overDark?scrollY>120:true;
     h.classList.toggle('fx',on);
     var m=document.documentElement.scrollHeight-innerHeight;
     p.style.width=(m>0?scrollY/m*100:0)+'%';}
   on(window,'scroll',u,{passive:true}); u();})();

/* ── réseau de points du héros ──
   The same field the home draws, lifted here so an inner hero is the same
   surface rather than a flat copy of it. It costs nothing on a page without
   the canvas, and it does not run at all when the visitor asked for less
   motion. */
  (function(){
    var cv=document.getElementById('net'); if(!cv) return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx=cv.getContext('2d'),W,H,pts=[],dpr=Math.min(devicePixelRatio||1,2);
    function size(){
      var r=cv.parentElement.getBoundingClientRect();
      W=cv.width=r.width*dpr; H=cv.height=r.height*dpr;
      cv.style.width=r.width+'px'; cv.style.height=r.height+'px';
      var n=Math.min(52,Math.floor(r.width/28));
      pts=Array.from({length:n},function(){return{
        x:Math.random()*W, y:Math.random()*H*.8,
        vx:(Math.random()-.5)*.13*dpr, vy:(Math.random()-.5)*.13*dpr,
        r:(Math.random()*1.5+.8)*dpr, p:Math.random()*6.28 };});
    }
    var t=0;
    function draw(){
      ctx.clearRect(0,0,W,H); t+=.012;
      var range=132*dpr;
      for(var i=0;i<pts.length;i++){ var p=pts[i];
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W) p.vx*=-1;
        if(p.y<0||p.y>H*.84) p.vy*=-1; }
      ctx.lineWidth=.75*dpr;
      for(var a=0;a<pts.length;a++) for(var b=a+1;b<pts.length;b++){
        var A=pts[a],B=pts[b],dx=A.x-B.x,dy=A.y-B.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<range){ ctx.strokeStyle='rgba(174,232,255,'+(0.2*(1-d/range)).toFixed(3)+')';
          ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke(); } }
      for(var k=0;k<pts.length;k++){ var q=pts[k];
        ctx.fillStyle='rgba(198,240,255,'+(0.4+0.32*Math.sin(t+q.p)).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(q.x,q.y,q.r,0,6.2832); ctx.fill(); }
      raf(draw);
    }
    size(); on(window,'resize',size); raf(draw);
  })();

/* ── révélations au scroll ── */
  function splitWords(node,out){
    [].slice.call(node.childNodes).forEach(function(nd){
      if(nd.nodeType===3){
        nd.textContent.split(/(\s+)/).forEach(function(t){
          if(!t) return;
          if(/^\s+$/.test(t)){ out.push(document.createTextNode(' ')); return; }
          var s=document.createElement('span'); s.className='w'; s.textContent=t; out.push(s);});
      } else if(nd.nodeName==='BR'){ out.push(nd.cloneNode(false)); }
      else if(nd.nodeType===1){
        /* A run that paints its text through its own background, which is how
           the gradient emphasis is drawn, cannot be split: span.w is
           inline-block, and background-clip:text stops clipping to glyphs that
           sit in a box of their own, so the whole run renders transparent and
           the sentence loses its ending. It reveals as a single word instead. */
        var cs=window.getComputedStyle(nd);
        if((cs.webkitBackgroundClip||cs.backgroundClip)==='text'){
          var whole=document.createElement('span');
          whole.className='w'; whole.appendChild(nd.cloneNode(true));
          /* Inline, not inline-block: an inline-block run cannot break, so a
             clause of eight words would be pushed whole onto a line of its own
             and read as a hard break in the middle of the sentence. Inline
             boxes ignore transform, so this run fades and unblurs where the
             others also rise, which nobody sees. */
          whole.style.display='inline';
          out.push(whole); return;
        }
        var shell=nd.cloneNode(false), inner=[];
        splitWords(nd,inner); inner.forEach(function(x){shell.appendChild(x);});
        out.push(shell);
      }});
  }
  document.querySelectorAll('.wsplit').forEach(function(el){
    /* Idempotent on purpose. React runs effects twice in development, and
       splitWords clones element nodes rather than rebuilding them, so a second
       pass carried the first pass's inline blur into the middle of the line and
       left two words permanently smeared. */
    if(el.dataset.split==='1') return;
    el.dataset.split='1';
    var blur=+(el.dataset.blur||0), out=[];
    splitWords(el,out);
    el.textContent=''; out.forEach(function(o){el.appendChild(o);});
    var ws=el.querySelectorAll('.w'), L=ws.length;
    ws.forEach(function(w,i){ w.style.transitionDelay=(i*0.042).toFixed(3)+'s'; });
    /* les derniers mots arrivent flous puis se résolvent, la phrase reste lisible */
    if(blur>0){
      for(var i=0;i<blur && i<L;i++){
        var w=ws[L-1-i], k=(blur-i)/blur;
        w.style.filter='blur('+(k*9).toFixed(1)+'px)';
        w.style.transition='opacity .7s var(--e), transform .7s var(--e), filter .95s var(--e)';
      }
      var last=[].slice.call(ws).slice(-blur);
      var cleared=false;
      var clear=function(){ if(cleared) return; cleared=true;
        last.forEach(function(w,j){ setTimeout(function(){ w.style.filter='blur(0px)'; },
          (L-blur+j)*42+340); }); };
      track(new IntersectionObserver(function(en,o){ if(!en[0].isIntersecting) return;
        clear(); o.disconnect();
      },{threshold:.2})).observe(el);
      /* A hero h1 is above the fold, so the observer above should fire at once.
         When it does not, the last words stay permanently blurred and the
         headline is unreadable, which is worse than losing the effect. This is
         the floor under it. */
      setTimeout(clear, 1600);
    }
  });


  (function(){
    var io=new IntersectionObserver(function(en){en.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('seen');io.unobserve(e.target);}});},
      {threshold:.12,rootMargin:'0px 0px -5% 0px'});
    observers.push(io);
    document.querySelectorAll('.rv,.stag,.wsplit,.crop,.dkc,.step,.circled').forEach(function(el){io.observe(el);});
  })();

  return () => {
    for (const [target, type, handler] of listeners) {
      target.removeEventListener(type, handler);
    }
    for (const o of observers) o.disconnect();
    for (const id of frames) cancelAnimationFrame(id);
  };
}
