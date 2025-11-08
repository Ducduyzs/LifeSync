// 🌸 File: /Public/js/tagModal.js
document.addEventListener("DOMContentLoaded", () => {
  const tagModal = document.getElementById("tagModal");
  const openTagBtn = document.getElementById("openTagModal");
  const closeTagBtn = document.getElementById("closeTagModal");
  const colorSquares = document.querySelectorAll(".color-square");
  const selectedColorInput = document.getElementById("selectedColor");
  const tagForm = document.getElementById("tagForm");

  // 🌸 Kiểm tra modal tồn tại
  if (!tagModal) return;

  // 🌸 Mở popup Add Tag
  if (openTagBtn) {
    openTagBtn.addEventListener("click", () => {
      tagModal.classList.add("show");
    });
  }

  // 🌸 Đóng popup khi bấm Cancel
  if (closeTagBtn) {
    closeTagBtn.addEventListener("click", () => {
      tagModal.classList.remove("show");
    });
  }

  // 🌸 Đóng popup khi click ra ngoài
  window.addEventListener("click", (e) => {
    if (e.target === tagModal) tagModal.classList.remove("show");
  });

  // 🌈 Chọn màu tag
  colorSquares.forEach((square) => {
    square.addEventListener("click", () => {
      // Bỏ chọn màu cũ
      colorSquares.forEach((s) => s.classList.remove("selected"));
      // Chọn màu mới
      square.classList.add("selected");
      // Ghi giá trị vào input hidden
      selectedColorInput.value = square.dataset.color;
    });
  });

  // 💾 Submit form Add Tag
  if (tagForm) {
    tagForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tagName = document.getElementById("tagName").value.trim();
      const tagColor = selectedColorInput.value;

      if (!tagName) {
        alert("⚠️ Please enter a tag name.");
        return;
      }

      try {
        // 🌸 Gọi API lưu tag vào database
        const response = await fetch("/tags/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: tagName, color: tagColor }),
        });

        const result = await response.json();

        if (result.success) {
          alert(`✅ Tag "${tagName}" added successfully!`);
          tagModal.classList.remove("show");
          tagForm.reset();
          colorSquares.forEach((s) => s.classList.remove("selected"));
        } else {
          alert("❌ Failed to save tag. Please try again.");
        }
      } catch (error) {
        console.error("Error saving tag:", error);
        alert("⚠️ Something went wrong while saving the tag.");
      }
    });
  }
});
