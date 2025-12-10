// toast
const toastContainer = document.createElement("div");
toastContainer.id = "toastContainer";
toastContainer.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
document.body.appendChild(toastContainer);

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
  }, 3000);
}



// project modal open + fill data
let currentChainId = null;

document.addEventListener("click", async (e) => {
  const item = e.target.closest(".project-item");
  if (!item) return;

  currentChainId = item.dataset.projectId;

  const modal = document.getElementById("projectDetailModal");
  const titleEl = document.getElementById("pdTitle");
  const descEl = document.getElementById("pdDescription");
  const colorDot = document.getElementById("pdColorDot");
  const priEl = document.getElementById("pdPriority");
  const timeEl = document.getElementById("pdTime");
  const tagEl = document.getElementById("pdTag2");
  const treeArea = document.getElementById("pdTreeArea");

  const r = await fetch(`/projects/detail/${currentChainId}`);
  const j = await r.json();
  if (!j.success) return;

  const p = j.project;

  titleEl.textContent = p.title || "";
  if (descEl) descEl.textContent = p.description || "";
  colorDot.style.backgroundColor = p.color || "#FFCACA";

  priEl.innerHTML = p.priority
    ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${p.priority}</span>`
    : "";

  const start = p.start_time
    ? new Date(p.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const end = p.end_time
    ? new Date(p.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  timeEl.innerHTML = start ? `<i class="bi bi-clock"></i> ${start}${end ? " – " + end : ""}` : "";
  tagEl.textContent = p.tag_title ? `#${p.tag_title}` : "";

  treeArea.innerHTML = buildNodeTreeHtml(p.nodes || []);

  modal.classList.add("show");
});



// close modal buttons
document.addEventListener("click", (e) => {
  if (e.target.closest("#closeProjectDetail")) {
    document.getElementById("projectDetailModal").classList.remove("show");
  }
});



// node tree
function buildNodeTreeHtml(nodes, parentId = null, level = 0) {
  const children = nodes.filter(n => n.parent_id === parentId);
  if (!children.length) return "";

  return `
    <div>
      ${children
        .map((n) => {
          const start = n.start_time
            ? new Date(n.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "";

          const end = n.end_time
            ? new Date(n.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "";

          const timeStr = start ? `${start}${end ? " – " + end : ""}` : "";

          return `
            <div class="${level > 0 ? "border-l-2 border-pink-100 ml-3 pl-4" : ""}">
              <div class="project-node-item flex justify-between items-center bg-white rounded-2xl shadow p-4 border border-pink-100 mb-2">
                <div class="flex items-center gap-3">
                  <input type="checkbox" ${n.is_done ? "checked" : ""}>
                  <span class="font-medium ${n.is_done ? "line-through text-gray-400" : ""}">
                    ${n.title}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-gray-600 text-sm">
                  ${timeStr ? `<span><i class="bi bi-clock"></i> ${timeStr}</span>` : ""}
                  ${n.tag_title ? `<span class="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-xs">#${n.tag_title}</span>` : ""}
                  ${n.priority ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${n.priority}</span>` : ""}
                </div>
              </div>
              ${buildNodeTreeHtml(nodes, n.node_id, level + 1)}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}



// edit project
document.getElementById("btnEditProject").addEventListener("click", () => {
  showToast("Edit project feature coming soon", "info");
});



// add branch
document.getElementById("btnAddBranch").addEventListener("click", async () => {
  const title = prompt("Branch title:");
  if (!title) return;

  await fetch(`/projects/node/add/${currentChainId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      note: "",
      priority: null,
      tag_id: null,
      parent_id: null
    })
  });

  document.querySelector(`.project-item[data-project-id="${currentChainId}"]`).click();
  showToast("Branch added", "success");
});


const deleteModal = document.getElementById("projectDeleteModal");
const btnDelete = document.getElementById("btnDeleteProject");
const btnCancelDelete = document.getElementById("cancelProjectDelete");
const btnConfirmDelete = document.getElementById("confirmProjectDelete");

btnDelete.addEventListener("click", () => {
  deleteModal.classList.remove("hidden");
  deleteModal.classList.add("show");
});

btnCancelDelete.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
  deleteModal.classList.remove("show");
});

btnConfirmDelete.addEventListener("click", async () => {
  try {
    const res = await fetch(`/projects/delete/${currentChainId}`, { method: "DELETE" });
    const j = await res.json();

    if (!j.success) return showToast("Delete failed", "error");

    showToast("Project deleted", "success");

    deleteModal.classList.add("hidden");
    deleteModal.classList.remove("show");

    document.getElementById("projectDetailModal").classList.remove("show");

    const item = document.querySelector(`.project-item[data-project-id="${currentChainId}"]`);
    if (item) item.remove();

    await loadProjects();

  } catch {
    showToast("Error deleting project", "error");
  }
});




// click-outside close
document.addEventListener("click", (e) => {
  const modal = document.getElementById("projectDetailModal");
  const box = document.getElementById("projectDetailBox");

  if (modal.classList.contains("show") && e.target === modal) {
    modal.classList.remove("show");
  }
});




