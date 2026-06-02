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
