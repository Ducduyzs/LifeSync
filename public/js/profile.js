const userToggle = document.getElementById("userToggle");
const userDropdown = document.getElementById("userDropdown");

if (userToggle && userDropdown) {
  userToggle.addEventListener("click", e => {
    e.stopPropagation();
    userDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    userDropdown.classList.add("hidden");
  });
}
