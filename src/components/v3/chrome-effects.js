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
  const on = (target, type, handler, opts) => {
    if (!target) return;
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler]);
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
  (function(){var h=document.getElementById('nh'),wm=document.getElementById('wm'),
   t=document.getElementById('tl'),p=document.getElementById('prog');
 if(!h||!p) return;
   // The prototype only ever sat on a dark hero, so unscrolled meant "over
   // dark". An inner page starts on white, and there the light state is the
   // right one from the first pixel.
   var overDark=!!document.querySelector('.v3-chrome.on-dark');
   function u(){var on=overDark?scrollY>120:true;
     h.classList.toggle('fx',on); if(wm) wm.classList.toggle('ob',!on); if(t) t.classList.toggle('w',!on);
     var m=document.documentElement.scrollHeight-innerHeight;
     p.style.width=(m>0?scrollY/m*100:0)+'%';}
   on(window,'scroll',u,{passive:true}); u();})();

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
  };
}
