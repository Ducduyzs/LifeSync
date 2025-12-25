// INIT
document.addEventListener("DOMContentLoaded", () => {

  // ELEMENTS
  const tagModal = document.getElementById("tagModal");
  const openTagBtn = document.getElementById("openTagModal");
  const closeTagBtn = document.getElementById("closeTagModal");
  const tagForm = document.getElementById("tagForm");
  const tagNameInput = document.getElementById("tagName");
  const colorSquares = document.querySelectorAll(".color-square");
  const selectedColorInput = document.getElementById("selectedColor");
  const tagManagerModal = document.getElementById("tagManagerModal");
  const tagManagerList = document.getElementById("tagManagerList");
  const tagDeleteConfirmModal = document.getElementById("tagDeleteConfirmModal");
  let tagToDelete = null;

  // TOAST
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

  // OPEN ADD TAG
  openTagBtn?.addEventListener("click", () => {
    tagForm.dataset.mode = "add";
    tagForm.dataset.id = "";
    tagForm.reset();
    selectedColorInput.value = "#FFCACA";

    colorSquares.forEach((s) => s.classList.remove("selected"));
    document.querySelector('.color-square[data-color="#FFCACA"]')?.classList.add("selected");

    tagModal.classList.add("show");
  });

  // CLOSE ADD TAG
  closeTagBtn?.addEventListener("click", () => {
    tagModal.classList.remove("show");
  });

  window.addEventListener("click", (e) => {
    if (e.target === tagModal) tagModal.classList.remove("show");
  });

  // SELECT COLOR
  colorSquares.forEach((square) => {
    square.addEventListener("click", () => {
      colorSquares.forEach((s) => s.classList.remove("selected"));
      square.classList.add("selected");
      selectedColorInput.value = square.dataset.color;
    });
  });

  // SUBMIT ADD / EDIT TAG
  tagForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mode = tagForm.dataset.mode || "add";
    const name = tagNameInput.value.trim();
    const color = selectedColorInput.value;

    if (!name) return showToast("Tag name is required", "error");

    let url = "/tags/add";
    let method = "POST";

    if (mode === "edit") {
      const id = tagForm.dataset.id;
      url = `/tags/${id}`;
      method = "PUT";
    }

    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, color }),
      });

      const j = await r.json();
      if (!j.success) return showToast("Failed to save tag", "error");

      showToast("Tag saved!", "success");
      tagModal.classList.remove("show");

      tagManagerModal.classList.remove("hidden");
      tagManagerModal.classList.add("show");

      await loadTagManager();
      if (typeof window.loadTags === "function") {
          await window.loadTags();
      }
      if (typeof window.loadTasks === "function") window.loadTasks();
      if (typeof window.loadProjects === "function") window.loadProjects();

    } catch (err) {
      console.error(err);
      showToast("Server error", "error");
    }
  });

  // LOAD TAG MANAGER
  async function loadTagManager() {
    try {
      const res = await fetch("/tags/list");
      const j = await res.json();
      if (!j.success) return;

      tagManagerList.innerHTML = j.tags
        .map(
          (t) => `
          <div class="flex justify-between items-center bg-pink-50 px-3 py-2 rounded-xl border border-pink-200">
            <span class="fw-semibold" style="color:${t.color}">#${t.title}</span>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-light edit-tag-btn" data-id="${t.tag_id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-tag-btn" data-id="${t.tag_id}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
    }
  }

  window.loadTagManager = loadTagManager;

  // OPEN TAG MANAGER
  document.getElementById("openTagManager")?.addEventListener("click", async () => {
    await loadTagManager();
    tagManagerModal.classList.remove("hidden");
    tagManagerModal.classList.add("show");
  });

  // CLOSE TAG MANAGER
  document.getElementById("closeTagManagerModal")?.addEventListener("click", () => {
    tagManagerModal.classList.add("hidden");
    tagManagerModal.classList.remove("show");
  });

  window.addEventListener("click", (e) => {
    if (e.target === tagManagerModal) {
      tagManagerModal.classList.add("hidden");
      tagManagerModal.classList.remove("show");
    }
  });

  // DELETE TAG POPUP
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-tag-btn");
    if (!btn) return;

    tagToDelete = btn.dataset.id;

    tagDeleteConfirmModal.classList.remove("hidden");
    tagDeleteConfirmModal.classList.add("show");
  });

  // CANCEL DELETE
  document.getElementById("cancelDeleteTag")?.addEventListener("click", () => {
    tagDeleteConfirmModal.classList.add("hidden");
    tagDeleteConfirmModal.classList.remove("show");
    tagToDelete = null;
  });

  // CONFIRM DELETE
  document.getElementById("confirmDeleteTag")?.addEventListener("click", async () => {
    if (!tagToDelete) return;

    try {
      const r = await fetch(`/tags/delete/${tagToDelete}`, { method: "DELETE" });
      const j = await r.json();

      if (j.success) {
        showToast("Tag deleted!", "success");
        tagDeleteConfirmModal.classList.add("hidden");
        tagDeleteConfirmModal.classList.remove("show");
        await loadTagManager();
        if (typeof window.loadTags === "function") {
          await window.loadTags();
        }
        if (typeof window.loadTasks === "function") window.loadTasks();
        if (typeof window.loadProjects === "function") window.loadProjects();
      } else {
        showToast("Failed to delete tag", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error", "error");
    }

    tagToDelete = null;
  });

  window.addEventListener("click", (e) => {
    if (e.target === tagDeleteConfirmModal) {
      tagDeleteConfirmModal.classList.add("hidden");
      tagDeleteConfirmModal.classList.remove("show");
      tagToDelete = null;
    }
  });

  // EDIT TAG POPUP
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".edit-tag-btn");
    if (!btn) return;

    const id = btn.dataset.id;

    try {
      const r = await fetch(`/tags/${id}`);
      const j = await r.json();
      if (!j.success) return showToast("Cannot load tag info", "error");

      const tag = j.tag;

      tagForm.dataset.mode = "edit";
      tagForm.dataset.id = id;

      tagNameInput.value = tag.title;
      selectedColorInput.value = tag.color;

      colorSquares.forEach((s) =>
        s.classList.toggle("selected", s.dataset.color === tag.color)
      );

      tagManagerModal.classList.add("hidden");
      tagManagerModal.classList.remove("show");

      tagModal.classList.add("show");

    } catch (err) {
      console.error(err);
      showToast("Cannot load tag info", "error");
    }
  });
});
