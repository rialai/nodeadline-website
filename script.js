const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

// Liquid-glass commission swipe bar: tap a segment or drag the thumb across it.
// Each tier updates the slots line, price note and Stripe link.
const glass = document.querySelector(".comm-glass");
if (glass) {
  const thumb = glass.querySelector(".thumb");
  const segs = Array.prototype.slice.call(glass.querySelectorAll(".comm-seg"));
  const amount = document.querySelector("[data-amount]");
  const slots = document.querySelector("[data-slots]");
  const note = document.querySelector("[data-note]");
  const pay = document.querySelector("[data-pay]");
  const secure = document.querySelector("[data-secure]");

  const TIERS = {
    "100": {
      amount: "100%",
      slots: '<span class="tk-k">Sold out</span> — no slots left at 100%.',
      note:
        'Pay nothing upfront and we keep <span class="tk-n">100%</span> of the turnover we can track — but every 100% slot is taken.',
      pay: null,
      href: null,
      secure: false,
    },
    "10": {
      amount: "10%",
      slots: 'Only <span class="tk-n">1</span> slot left at 10%.',
      note:
        'Name your contribution at checkout. We then take <span class="tk-n">10%</span> of the revenue we can prove over the year, tracked in your <span class="tk-ty">ERP</span>.',
      pay: "Contribute & lock in 10%",
      href: "https://donate.stripe.com/5kQeVdeuNdPH1V10wsejK00",
      secure: true,
    },
    "1": {
      amount: "1%",
      slots: '<span class="tk-n">10</span> slots available at 1%.',
      note:
        '<strong>€3,650</strong> upfront — <span class="tk-n">€10</span> a day for a year. We then take just <span class="tk-n">1%</span> of the revenue we can prove over the same <span class="tk-n">12</span> months, tracked in your <span class="tk-ty">ERP</span>.',
      pay: "Pay €3,650 securely",
      href: "https://buy.stripe.com/9B6fZh1I13b34391AwejK01",
      secure: true,
    },
  };

  function thumbTo(i) {
    thumb.style.transform = "translateX(" + i * 100 + "%)";
  }

  function apply(comm) {
    const t = TIERS[comm];
    if (!t) return;
    segs.forEach((s) => {
      const active = s.dataset.comm === comm;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-selected", String(active));
    });
    if (amount) amount.textContent = t.amount;
    if (slots) slots.innerHTML = t.slots;
    if (note) note.innerHTML = t.note;
    if (pay) {
      if (t.href) {
        pay.hidden = false;
        pay.textContent = t.pay;
        pay.setAttribute("href", t.href);
      } else {
        pay.hidden = true;
      }
    }
    if (secure) secure.hidden = !t.secure;
  }

  // tap / keyboard select
  segs.forEach((s, i) => {
    s.addEventListener("click", () => {
      thumbTo(i);
      apply(s.dataset.comm);
    });
  });

  // drag / swipe select
  let dragging = false;
  let moved = false;
  let startX = 0;
  let segW = 0;
  let lastX = 0;

  glass.addEventListener("pointerdown", (e) => {
    segW = thumb.getBoundingClientRect().width;
    startX = e.clientX;
    moved = false;
    dragging = true;
    try {
      glass.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
  });

  glass.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - startX) > 4) moved = true;
    if (!moved) return;
    glass.classList.add("dragging");
    const rect = glass.getBoundingClientRect();
    let x = e.clientX - rect.left - 4 - segW / 2;
    x = Math.max(0, Math.min(segW * 2, x));
    thumb.style.transform = "translateX(" + x + "px)";
    lastX = x;
  });

  glass.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    glass.classList.remove("dragging");
    if (moved) {
      const i = Math.max(0, Math.min(2, Math.round(lastX / segW)));
      thumbTo(i);
      apply(segs[i].dataset.comm);
    }
    // a plain tap is handled by the segment click listener
  });

  // init to the default-active segment (1%)
  let initIdx = segs.findIndex((s) => s.classList.contains("is-active"));
  if (initIdx < 0) initIdx = 0;
  thumbTo(initIdx);
  apply(segs[initIdx].dataset.comm);
}
