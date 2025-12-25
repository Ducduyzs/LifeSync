document.addEventListener("DOMContentLoaded", () => {
  const flipBtn = document.getElementById("flipBtn");
  const flipContainer = document.getElementById("flipContainer");

  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      flipContainer.classList.toggle("flipped");
    });
  }
});


