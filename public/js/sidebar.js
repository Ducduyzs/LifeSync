document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const body = document.body;
    const icon = toggleBtn.querySelector("i");

    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
      icon.classList.replace("bi-moon-fill", "bi-sun-fill");
      document.body.style.backgroundColor = "#1a1a1a";
    } else {
      icon.classList.replace("bi-sun-fill", "bi-moon-fill");
      document.body.style.backgroundColor = "#fff0f5";
    }
  });
});
