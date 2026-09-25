document.addEventListener("DOMContentLoaded", () => {
  const ctaBtn = document.getElementById("cta-btn");

  if (ctaBtn) {
    ctaBtn.addEventListener("click", () => {
      alert("Inquiry received. An asset manager will reach out shortly.");
    });
  }

  console.log("Aequitas Asset Management system initialized.");
});
