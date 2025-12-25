let isDark = false

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle")
  const icon = document.getElementById("themeIcon")

  isDark = localStorage.getItem("theme") === "dark"
  document.body.classList.toggle("dark", isDark)
  icon.className = isDark
    ? "bi bi-moon-fill text-white text-2xl"
    : "bi bi-sun-fill text-white text-2xl"

  toggle.onclick = () => {
    isDark = !isDark
    document.body.classList.toggle("dark", isDark)
    icon.className = isDark
      ? "bi bi-moon-fill text-white text-2xl"
      : "bi bi-sun-fill text-white text-2xl"
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }
})

