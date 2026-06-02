const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

// Commission switcher: pick a tier, the price note + Stripe link update to match.
const commOpts = document.querySelectorAll(".comm-opt");
if (commOpts.length) {
  const amount = document.querySelector("[data-amount]");
  const note = document.querySelector("[data-note]");
  const pay = document.querySelector("[data-pay]");
  const secure = document.querySelector("[data-secure]");

  const TIERS = {
    "100": {
      amount: "100%",
      note:
        'Pay nothing upfront — we keep <span class="tk-n">100%</span> of the turnover we can track. The price of not contributing.',
      pay: "Start at 100% — free",
      href: "mailto:nikolai@riabets.com?subject=Nodeadline%20%E2%80%94%20start%20at%20100%25",
      secure: false,
    },
    "10": {
      amount: "10%",
      note:
        'Name your contribution at checkout. We then take <span class="tk-n">10%</span> of the revenue we can prove over the year, tracked in your <span class="tk-ty">ERP</span>.',
      pay: "Contribute & lock in 10%",
      href: "https://donate.stripe.com/5kQeVdeuNdPH1V10wsejK00",
      secure: true,
    },
    "1": {
      amount: "1%",
      note:
        '<strong>€3,650</strong> upfront — <span class="tk-n">€10</span> a day for a year. We then take just <span class="tk-n">1%</span> of the revenue we can prove over the same <span class="tk-n">12</span> months, tracked in your <span class="tk-ty">ERP</span>.',
      pay: "Pay €3,650 securely",
      href: "https://buy.stripe.com/9B6fZh1I13b34391AwejK01",
      secure: true,
    },
  };

  commOpts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tier = TIERS[btn.dataset.comm];
      if (!tier) return;
      commOpts.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      if (amount) amount.textContent = tier.amount;
      if (note) note.innerHTML = tier.note;
      if (pay) {
        pay.textContent = tier.pay;
        pay.href = tier.href;
      }
      if (secure) secure.hidden = !tier.secure;
    });
  });
}
