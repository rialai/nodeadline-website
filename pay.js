const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const params = new URLSearchParams(window.location.search);
if (params.get("paid") === "1") {
  const thanks = document.getElementById("thanks");
  if (thanks) {
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
if (params.get("cancelled") === "1") {
  const cancelled = document.getElementById("cancelled");
  if (cancelled) {
    cancelled.hidden = false;
  }
}

const bankToggle = document.getElementById("bankToggle");
const bankDetails = document.getElementById("bankDetails");
if (bankToggle && bankDetails) {
  bankToggle.addEventListener("click", () => {
    const open = bankDetails.hidden;
    bankDetails.hidden = !open;
    bankToggle.setAttribute("aria-expanded", String(open));
    bankToggle.textContent = open ? "Hide bank transfer details" : "Prefer a bank transfer?";
  });
}

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.parentElement?.querySelector("[data-copy]")?.textContent?.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const original = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1500);
    } catch {
      /* clipboard unavailable; ignore */
    }
  });
});
