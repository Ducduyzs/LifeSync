const toastContainer =
  document.getElementById("toastContainer") ||
  (() => {
    const tc = document.createElement("div");
    tc.id = "toastContainer";
    tc.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 5000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(tc);
    return tc;
  })();

function showToast(message, type = "info") {
  if (!message) return;
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    min-width: 240px;
    padding: 12px 16px;
    border-radius: 12px;
    color: #fff;
    font-weight: 500;
    font-size: 0.95rem;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    transition: opacity 0.3s ease;
  `;
  if (type === "success") toast.style.background = "#9ae6b4";
  if (type === "error") toast.style.background = "#feb2b2";
  if (type === "warning") toast.style.background = "#fbd38d";
  if (type === "info") toast.style.background = "#90cdf4";
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.__TOAST__?.message) {
    showToast(window.__TOAST__.message, window.__TOAST__.type);
  }
});
