// Matrix-style logo: each letter cycles through random glyphs (green, glowing)
// then resolves to the brand name. Same mono font, white background.
(function () {
  const els = document.querySelectorAll(".brand.matrix");
  if (!els.length) return;

  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/=+";
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  els.forEach((el) => {
    const target = el.textContent.trim();
    el.setAttribute("aria-label", target);
    el.textContent = "";

    const spans = Array.prototype.map.call(target, (ch) => {
      const s = document.createElement("span");
      s.textContent = ch;
      s.dataset.final = ch;
      s.setAttribute("aria-hidden", "true");
      el.appendChild(s);
      return s;
    });

    if (reduce) return; // keep it static for reduced-motion users

    function scramble() {
      spans.forEach((s, i) => {
        const final = s.dataset.final;
        const frames = 5 + i * 2 + Math.floor(Math.random() * 5);
        let f = 0;
        clearInterval(s._t);
        s._t = setInterval(() => {
          if (f >= frames) {
            clearInterval(s._t);
            s.textContent = final;
            s.classList.remove("on");
            return;
          }
          s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          s.classList.add("on");
          f++;
        }, 45);
      });
    }

    scramble();
    setInterval(scramble, 3800);
    el.addEventListener("mouseenter", scramble);
  });
})();
