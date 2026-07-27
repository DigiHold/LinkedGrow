/*
 * The monthly/yearly toggle, split out of the landing script so the pricing
 * block works on its own page.
 *
 * Two things the extracted copy needed: the `on` helper it used for the resize
 * listener, which lived in the landing module, and a guard on every lookup.
 * A page without the toggle must not throw, because a throwing effect takes
 * the whole subtree down with it.
 */
export function initV3Pricing() {
  const listeners = [];
  const on = (target, type, handler) => {
    target.addEventListener(type, handler);
    listeners.push([target, type, handler]);
  };

  const tg = document.getElementById("tg");
  const pip = document.getElementById("pip");
  if (tg && pip) {
    const bs = [].slice.call(tg.querySelectorAll("button"));
    const move = (b) => {
      if (!b) return;
      pip.style.width = b.offsetWidth + "px";
      pip.style.transform = "translateX(" + (b.offsetLeft - 5) + "px)";
    };
    move(bs[0]);
    on(window, "resize", () => move(tg.querySelector(".on")));
    bs.forEach((b) => {
      b.onclick = function () {
        bs.forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        move(b);
        const k = b.dataset.p;
        document.querySelectorAll("[data-" + k + "]").forEach((el) => {
          el.textContent = el.dataset[k];
        });
      };
    });
  }

  return () => {
    for (const [target, type, handler] of listeners) {
      target.removeEventListener(type, handler);
    }
  };
}
