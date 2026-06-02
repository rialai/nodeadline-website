const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

// Liquid-glass commission swipe bar: tap a segment or grab + drag the thumb
// across it (mouse, touch and pen via Pointer Events). Each tier updates the
// slots line, price note and Stripe link.
const glass = document.querySelector(".comm-glass");
if (glass) {
  const thumb = glass.querySelector(".thumb");
  const segs = Array.prototype.slice.call(glass.querySelectorAll(".comm-seg"));
  const amount = document.querySelector("[data-amount]");
  const slots = document.querySelector("[data-slots]");
  const note = document.querySelector("[data-note]");
  const pay = document.querySelector("[data-pay]");
  const secure = document.querySelector("[data-secure]");
  const last = segs.length - 1;

  const TIERS = {
    "100": {
      amount: "100%",
      slots: '<span class="tk-k">Sold out</span> — no slots left at 100%.',
      note:
        'Pay nothing upfront — we keep <span class="tk-n">100%</span> of the turnover we can track. The price of not contributing. We expect to take <span class="tk-n">10%</span> of the <span class="tk-n">€3,650</span> we track in your first few days.',
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

  // apply() is the single source of truth: it always re-syncs the thumb to the
  // active tier, so thumb + selection can never drift apart.
  function apply(comm) {
    const t = TIERS[comm];
    if (!t) return;
    const idx = segs.findIndex((s) => s.dataset.comm === comm);
    segs.forEach((s, k) => {
      const active = k === idx;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-selected", String(active));
    });
    if (idx >= 0) thumbTo(idx);
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

  function segWidth() {
    return thumb.getBoundingClientRect().width;
  }
  function pxFromClientX(clientX) {
    const rect = glass.getBoundingClientRect();
    const w = segWidth();
    const x = clientX - rect.left - 4 - w / 2; // 4px = track padding
    return Math.max(0, Math.min(w * last, x));
  }
  function idxFromClientX(clientX) {
    const w = segWidth();
    const i = Math.round(pxFromClientX(clientX) / w);
    return Math.max(0, Math.min(last, i));
  }

  let dragging = false;
  let moved = false;
  let startX = 0;
  let suppressClick = false;

  glass.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    try {
      glass.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
    e.preventDefault();
  });

  glass.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - startX) > 4) moved = true;
    if (!moved) return;
    glass.classList.add("dragging");
    thumb.style.transform = "translateX(" + pxFromClientX(e.clientX) + "px)";
  });

  function endPointer(e) {
    if (!dragging) return;
    dragging = false;
    glass.classList.remove("dragging");
    apply(segs[idxFromClientX(e.clientX)].dataset.comm);
    // a pointer interaction already selected; swallow the trailing click so it
    // can't re-select a different segment.
    suppressClick = true;
    setTimeout(() => {
      suppressClick = false;
    }, 60);
  }

  glass.addEventListener("pointerup", endPointer);
  glass.addEventListener("pointercancel", () => {
    dragging = false;
    moved = false;
    glass.classList.remove("dragging");
  });

  // keyboard / fallback: Enter or Space on a focused segment
  segs.forEach((s) => {
    s.addEventListener("click", () => {
      if (suppressClick) return;
      apply(s.dataset.comm);
    });
  });

  // init to the default-active segment (1%)
  const initSeg =
    segs.find((s) => s.classList.contains("is-active")) || segs[last];
  apply(initSeg.dataset.comm);
}
