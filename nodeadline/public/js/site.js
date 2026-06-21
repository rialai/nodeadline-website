/* nodeadline — site glue.
   - submitLead(): POST the lead forms to the Frappe Guest endpoint (creates an
     ERPNext Lead), with CSRF + honeypot.
   - commission swipe bar: tap a segment or drag the thumb; updates the offer copy
     and the tier the "request access" form sends.
   Served at /assets/nodeadline/js/site.js */
(function () {
  "use strict";

  var NDL = (window.NDL = window.NDL || {});
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // ---------- CSRF ----------
  function csrfToken() {
    var m = document.querySelector('meta[name="frappe-csrf-token"]');
    var t = m ? (m.getAttribute("content") || "") : "";
    return t && t !== "None" ? t : "";
  }

  // ---------- lead submit ----------
  function submitLead(payload) {
    var headers = { "Content-Type": "application/json" };
    var t = csrfToken();
    if (t) headers["X-Frappe-CSRF-Token"] = t;
    return fetch("/api/method/nodeadline.api.create_lead", {
      method: "POST",
      headers: headers,
      credentials: "include",
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.status === 429 || res.status === 417) {
        throw new Error("Too many tries — give it a few minutes, then retry.");
      }
      if (!res.ok) {
        throw new Error(
          "Couldn't reach us just now. Email nikolai@riabets.com and we'll set you up."
        );
      }
      return res.json();
    }).then(function (data) {
      var msg = data && data.message ? data.message : data;
      if (msg && msg.success === false) {
        throw new Error(
          "We couldn't save that — email nikolai@riabets.com and we'll sort it."
        );
      }
      return msg || { success: true };
    });
  }
  NDL.submitLead = submitLead;

  // ---------- current commission tier (read by the offer form) ----------
  var currentComm = "1";
  NDL.getComm = function () { return currentComm; };

  // ---------- lead forms ----------
  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || "").trim() : "";
  }
  function setStatus(el, msg, cls) {
    if (!el) return;
    el.textContent = msg;
    el.className = "lead-status " + (cls || "");
    el.hidden = false;
  }
  function looksLikeEmail(s) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
  }

  each(document.querySelectorAll("[data-lead-form]"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector("[data-lead-status]");
      var btn = form.querySelector("[data-lead-submit]");
      var emailEl = form.querySelector('input[name="email"]');
      var email = emailEl ? String(emailEl.value || "").trim() : "";

      if (!looksLikeEmail(email)) {
        setStatus(status, "Please enter a valid email.", "is-err");
        if (emailEl) emailEl.focus();
        return;
      }

      var cta = form.getAttribute("data-cta") || "contact";
      var message = val(form, "message");
      if (cta === "request-access") {
        message =
          (message ? message + " · " : "") + "Commission tier: " + currentComm + "%";
      }

      var payload = {
        email: email,
        name: val(form, "name"),
        company: val(form, "company"),
        phone: val(form, "phone"),
        message: message,
        website: val(form, "website"), // honeypot
        cta: cta
      };

      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setStatus(status, "", "");
      status && (status.hidden = true);

      submitLead(payload).then(function () {
        form.reset();
        setStatus(
          status,
          "Got it — we'll be in touch at " + email + ". Check your inbox.",
          "is-ok"
        );
      }).catch(function (err) {
        setStatus(status, err.message || "Something went wrong.", "is-err");
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  });

  // ---------- commission swipe bar ----------
  var TIERS = {
    "100": {
      amount: "100%",
      slots: '<span class="tk-k">Sold out</span> — no slots left at 100%.',
      note:
        'Pay nothing upfront — we keep <span class="tk-n">100%</span> of the turnover we can track. The price of not contributing. We expect to take <span class="tk-n">10%</span> of the <span class="tk-n">€3,650</span> we track in your first few days.'
    },
    "10": {
      amount: "10%",
      slots: 'Only <span class="tk-n">1</span> slot left at 10%.',
      note:
        '<strong>€365</strong> upfront — <span class="tk-n">€1</span> a day for a year. We then take <span class="tk-n">10%</span> of the revenue we can prove over the same <span class="tk-n">12</span> months, tracked in your <span class="tk-ty">ERP</span>.'
    },
    "1": {
      amount: "1%",
      slots: '<span class="tk-n">10</span> slots available at 1%.',
      note:
        '<strong>€3,650</strong> upfront — <span class="tk-n">€10</span> a day for a year. We then take just <span class="tk-n">1%</span> of the revenue we can prove over the same <span class="tk-n">12</span> months, tracked in your <span class="tk-ty">ERP</span>.'
    }
  };

  var glass = document.querySelector(".comm-glass");
  if (glass) {
    var thumb = glass.querySelector(".thumb");
    var segs = Array.prototype.slice.call(glass.querySelectorAll(".comm-seg"));
    var amount = document.querySelector("[data-amount]");
    var slots = document.querySelector("[data-slots]");
    var note = document.querySelector("[data-note]");
    var last = segs.length - 1;

    function thumbTo(i) { thumb.style.transform = "translateX(" + i * 100 + "%)"; }

    function apply(comm) {
      var t = TIERS[comm];
      if (!t) return;
      currentComm = comm;
      var idx = segs.findIndex(function (s) { return s.dataset.comm === comm; });
      segs.forEach(function (s, k) {
        var active = k === idx;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-selected", String(active));
      });
      if (idx >= 0) thumbTo(idx);
      if (amount) amount.textContent = t.amount;
      if (slots) slots.innerHTML = t.slots;
      if (note) note.innerHTML = t.note;
    }

    function segWidth() { return thumb.getBoundingClientRect().width; }
    function pxFromClientX(clientX) {
      var rect = glass.getBoundingClientRect();
      var w = segWidth();
      var x = clientX - rect.left - 4 - w / 2; // 4px = track padding
      return Math.max(0, Math.min(w * last, x));
    }
    function idxFromClientX(clientX) {
      var w = segWidth();
      var i = Math.round(pxFromClientX(clientX) / w);
      return Math.max(0, Math.min(last, i));
    }

    var dragging = false, moved = false, startX = 0, suppressClick = false;

    glass.addEventListener("pointerdown", function (e) {
      dragging = true; moved = false; startX = e.clientX;
      try { glass.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });
    glass.addEventListener("pointermove", function (e) {
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
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 60);
    }
    glass.addEventListener("pointerup", endPointer);
    glass.addEventListener("pointercancel", function () {
      dragging = false; moved = false; glass.classList.remove("dragging");
    });
    segs.forEach(function (s) {
      s.addEventListener("click", function () {
        if (suppressClick) return;
        apply(s.dataset.comm);
      });
      // Keyboard support for the ARIA tablist (Enter/Space already fire click
      // natively on <button>; add roving arrow / Home / End navigation).
      s.addEventListener("keydown", function (e) {
        var i = segs.indexOf(s), ni = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = Math.min(last, i + 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = Math.max(0, i - 1);
        else if (e.key === "Home") ni = 0;
        else if (e.key === "End") ni = last;
        else return;
        e.preventDefault();
        apply(segs[ni].dataset.comm);
        segs[ni].focus();
      });
    });

    var initSeg = segs.find(function (s) { return s.classList.contains("is-active"); }) || segs[last];
    apply(initSeg.dataset.comm);
  }
})();
