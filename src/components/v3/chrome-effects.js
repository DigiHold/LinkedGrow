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
  const on = (target, type, handler, opts) => {
    if (!target) return;
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler]);
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

  return () => {
    for (const [target, type, handler] of listeners) {
      target.removeEventListener(type, handler);
    }
  };
}
