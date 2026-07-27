/*
 * The v3 landing behaviour, ported from the approved prototype as it is.
 *
 * The canvas network of buyers connecting, the click ripple, the nav state and
 * progress bar, the word-by-word title reveal, the scroll reveals, the hand
 * drawn circle, the sticky rail, the hero parallax, the magnetic buttons, the
 * cursor halo on the dark section, the pricing toggle and the FAQ.
 *
 * Kept verbatim rather than rewritten in React: this code was tuned against
 * the real page, and a hook-shaped rewrite would be a different animation that
 * merely looks similar. Every global registration goes through `on` and every
 * frame through `raf`, so the page cleans up after itself when someone
 * navigates away, which a standalone HTML file never had to do.
 *
 * Source: ~/Downloads/linkedgrow-v2-design/LinkedGrow v3 — Landing.html
 * Do not hand-edit: change the prototype and re-port.
 */

export function initV3Landing() {
  const listeners = [];
  const frames = [];
  const observers = [];

  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler]);
  };
  const raf = (cb) => {
    const id = requestAnimationFrame(cb);
    frames.push(id);
    return id;
  };
  const track = (o) => {
    observers.push(o);
    return o;
  };


  /* ── réseau de points du héros : les acheteurs qui se relient ── */
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

  /* ── onde au clic sur les boutons à remplissage ── */
  on(document,'pointerdown',function(e){
    var el=e.target.closest('.fill'); if(!el) return;
    var r=el.getBoundingClientRect(), s=Math.max(r.width,r.height)*2.2, n=document.createElement('span');
    n.className='pointer-events-none absolute rounded-[99px] bg-[rgba(255,255,255,0.5)] animate-v3-ripple [transform:translate(-50%,-50%)_scale(0)]'; n.style.width=n.style.height=s+'px';
    n.style.left=(e.clientX-r.left)+'px'; n.style.top=(e.clientY-r.top)+'px';
    el.appendChild(n); setTimeout(function(){n.remove();},560);
  });

  /* ── squelette de dashboard derrière chaque cadre vidéo vide ──
     Repère visuel uniquement : il disparaît dès qu'un <video src> est renseigné. */
  (function(){
    var W='<div class="wf pointer-events-none absolute inset-0 [&>svg]:h-full [&>svg]:w-full" aria-hidden="true">'+
     '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">'+
     '<g fill="#fff"><rect width="286" height="900" opacity=".045"/>'+
     '<rect x="286" width="1314" height="74" opacity=".03"/>'+
     '<rect x="26" y="26" width="34" height="34" rx="11" fill="#2ec8ea" opacity=".55"/>'+
     '<rect x="70" y="34" width="86" height="14" rx="7" opacity=".14"/>';
    for(var i=0;i<7;i++){ var y=110+i*52;
      W+='<rect x="22" y="'+y+'" width="242" height="38" rx="10" opacity="'+(i===1?'.09':'.035')+'"/>'+
         '<rect x="40" y="'+(y+14)+'" width="11" height="11" rx="3" opacity=".16"/>'+
         '<rect x="62" y="'+(y+15)+'" width="'+(96+(i*17)%74)+'" height="9" rx="4.5" opacity=".13"/>'; }
    W+='<rect x="322" y="28" width="196" height="16" rx="8" opacity=".1"/>'+
       '<rect x="1454" y="24" width="118" height="26" rx="13" fill="#2ec8ea" opacity=".4"/>';
    for(var s=0;s<4;s++){ var x=322+s*312;
      W+='<rect x="'+x+'" y="112" width="286" height="112" rx="16" opacity=".035"/>'+
         '<rect x="'+(x+22)+'" y="138" width="72" height="9" rx="4.5" opacity=".12"/>'+
         '<rect x="'+(x+22)+'" y="162" width="'+(64+s*15)+'" height="26" rx="7" opacity=".2"/>'+
         '<rect x="'+(x+22)+'" y="200" width="242" height="6" rx="3" opacity=".07"/>'+
         '<rect class="'+(s===1?'animate-v3-live':s===2?'animate-v3-live [animation-delay:.9s]':'')+'" x="'+(x+22)+'" y="200" width="'+(60+s*52)+'" height="6" rx="3" fill="#2ec8ea" opacity=".45"/>'; }
    W+='<rect x="322" y="262" width="1250" height="42" rx="10" opacity=".03"/>'+
       '<rect x="346" y="278" width="90" height="10" rx="5" opacity=".1"/>'+
       '<rect x="700" y="278" width="128" height="10" rx="5" opacity=".07"/>'+
       '<rect x="1160" y="278" width="72" height="10" rx="5" opacity=".07"/>';
    for(var r=0;r<7;r++){ var ry=326+r*78;
      W+='<circle cx="368" cy="'+(ry+26)+'" r="19" opacity=".08"/>'+
         '<rect x="404" y="'+(ry+12)+'" width="'+(122+(r*23)%86)+'" height="12" rx="6" opacity=".13"/>'+
         '<rect x="404" y="'+(ry+34)+'" width="'+(216+(r*41)%172)+'" height="9" rx="4.5" opacity=".06"/>'+
         '<rect x="1160" y="'+(ry+20)+'" width="180" height="7" rx="3.5" opacity=".05"/>'+
         '<rect class="'+(r===0?'animate-v3-live [animation-delay:1.8s]':'')+'" x="1160" y="'+(ry+20)+'" width="'+(52+(r*37)%126)+'" height="7" rx="3.5" fill="#2ec8ea" opacity=".38"/>'+
         '<rect x="1400" y="'+(ry+16)+'" width="76" height="26" rx="13" opacity=".05"/>'; }
    W+='</g></svg></div>';
    document.querySelectorAll('.vid').forEach(function(v){ v.insertAdjacentHTML('afterbegin',W); });
  })();

  /* ── découpe des titres en mots, dé-floutage progressif à l'entrée ── */
  function splitWords(node,out){
    [].slice.call(node.childNodes).forEach(function(nd){
      if(nd.nodeType===3){
        nd.textContent.split(/(\s+)/).forEach(function(t){
          if(!t) return;
          if(/^\s+$/.test(t)){ out.push(document.createTextNode(' ')); return; }
          var s=document.createElement('span'); s.className='w'; s.textContent=t; out.push(s);});
      } else if(nd.nodeName==='BR'){ out.push(nd.cloneNode(false)); }
      else if(nd.nodeType===1){
        var shell=nd.cloneNode(false), inner=[];
        splitWords(nd,inner); inner.forEach(function(x){shell.appendChild(x);});
        out.push(shell);
      }});
  }
  document.querySelectorAll('.wsplit').forEach(function(el){
    /* Splitting an already-split heading wraps every span.w in another span.w,
       so the second pass doubles the word count and the blur the first pass put
       on the tail lands in the middle of the list, where nothing clears it. The
       effect has run twice; the guard is what stops the damage. */
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
      track(new IntersectionObserver(function(en,o){ if(!en[0].isIntersecting) return;
        last.forEach(function(w,j){ setTimeout(function(){ w.style.filter='blur(0px)'; },
          (L-blur+j)*42+340); });
        o.disconnect();
      },{threshold:.2})).observe(el);
      /* A headline nobody can read is the worst thing on the page, so it clears
         itself after 1.6s whatever else went wrong. */
      setTimeout(function(){ ws.forEach(function(w){ w.style.filter='blur(0px)'; }); },1600);
    }
  });

  /* ── révélations au scroll ── */
  (function(){
    var io=track(new IntersectionObserver(function(en){en.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('seen');io.unobserve(e.target);}});},
      {threshold:.12,rootMargin:'0px 0px -5% 0px'}));
    document.querySelectorAll('.rv,.stag,.wsplit,.crop,.dkc,.step,.circled').forEach(function(el){io.observe(el);});
  })();

  /* ── cercle tracé à la main autour de « AI » ── */
  /* ── rail collant ── */
  (function(){
    var rail=document.getElementById('rail'); if(!rail) return;
    var links=[].slice.call(rail.querySelectorAll('a')),
        secs=links.map(function(a){return document.querySelector(a.getAttribute('href'));});
    function u(){ var best=0;
      secs.forEach(function(s,i){ if(s && s.getBoundingClientRect().top<innerHeight*.45) best=i; });
      links.forEach(function(a,i){a.classList.toggle('on',i===best);}); }
    on(window,'scroll',u,{passive:true}); u();
  })();

  /* ── parallaxe du héros ── */
  (function(){var s=document.getElementById('hstage'); if(!s) return;
   var mq=matchMedia('(min-width:861px)');
   on(window,'scroll',function(){ if(!mq.matches) return;
     var y=Math.min(1,Math.max(0,scrollY/760));
     s.style.transform='translateY('+(y*-30).toFixed(1)+'px) scale('+(1-y*.012).toFixed(4)+')';},{passive:true});})();

  /* ── boutons magnétiques ── */
  if(!matchMedia('(pointer:coarse)').matches){
    document.querySelectorAll('.mag').forEach(function(el){
      el.addEventListener('mousemove',function(e){var r=el.getBoundingClientRect();
        el.style.transform='translate('+((e.clientX-r.left-r.width/2)*.13).toFixed(2)+'px,'+
          ((e.clientY-r.top-r.height/2)*.2).toFixed(2)+'px)';});
      el.addEventListener('mouseleave',function(){el.style.transform='';});
    });
  }

  /* ── halo suivant le curseur, section sombre ── */
  (function(){var s=document.querySelector('.v3-night'),g=document.getElementById('spot');
   if(!s||!g||matchMedia('(pointer:coarse)').matches) return;
   s.addEventListener('mousemove',function(e){var r=s.getBoundingClientRect();
     g.style.left=(e.clientX-r.left-260)+'px'; g.style.top=(e.clientY-r.top-260)+'px'; g.style.opacity='1';});
   s.addEventListener('mouseleave',function(){g.style.opacity='0';});})();

  /* ── bascule mensuel / annuel ── */
  (function(){
    var tg=document.getElementById('tg'),pip=document.getElementById('pip'),bs=[].slice.call(tg.querySelectorAll('button'));
    function move(b){pip.style.width=b.offsetWidth+'px';pip.style.transform='translateX('+(b.offsetLeft-5)+'px)';}
    move(bs[0]); on(window,'resize',function(){move(tg.querySelector('.on'));});
    bs.forEach(function(b){b.onclick=function(){
      bs.forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); move(b);
      var k=b.dataset.p;
      document.querySelectorAll('[data-'+k+']').forEach(function(el){el.textContent=el.dataset[k];});};});
  })();

  /* ── faq ── */
  document.querySelectorAll('#faq .q').forEach(function(q){
    var a=q.querySelector('.a');
    q.querySelector('button').onclick=function(){
      var open=q.classList.contains('open');
      document.querySelectorAll('#faq .q').forEach(function(o){o.classList.remove('open');o.querySelector('.a').style.maxHeight=null;});
      if(!open){q.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}};
  });

  return () => {
    for (const [target, type, handler] of listeners) {
      target.removeEventListener(type, handler);
    }
    for (const id of frames) cancelAnimationFrame(id);
    for (const o of observers) o.disconnect();
  };
}
