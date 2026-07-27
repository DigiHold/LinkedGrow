/*
 * The FAQ accordion, split out so the block works on its own page.
 * Guarded: a question without a button would otherwise throw and take the
 * whole subtree down with it.
 */
export function initV3Faq() {
  document.querySelectorAll("#faq .q").forEach((q) => {
    const a = q.querySelector(".a");
    const button = q.querySelector("button");
    if (!a || !button) return;
    button.onclick = function () {
      const open = q.classList.contains("open");
      document.querySelectorAll("#faq .q").forEach((o) => {
        o.classList.remove("open");
        const oa = o.querySelector(".a");
        if (oa) oa.style.maxHeight = null;
      });
      if (!open) {
        q.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    };
  });
  return () => {};
}
