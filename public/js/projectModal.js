// project modal logic

import { renderProjectDetail } from "/js/projectDetailTemplate.js";
import { renderNodeDetail } from "/js/nodeDetailTemplate.js";

let currentChainIdForBranch = null;
let deleteTarget = null;

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

// load tags
async function loadBranchTags() {
  const tagSelect = document.getElementById("taskTagSelect");
  if (!tagSelect) return;

  try {
    const res = await fetch("/tags/list");
    const j = await res.json();
    tagSelect.innerHTML = `<option value="">-- No tag --</option>`;
    if (j.success) {
      j.tags.forEach((t) => {
        const op = document.createElement("option");
        op.value = t.tag_id;
        op.textContent = t.title;
        tagSelect.appendChild(op);
      });
    }
  } catch (err) {
    console.error("Failed loading tags:", err);
  }
}

// open project detail
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
  const box = document.getElementById("projectDetailFormBox");

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

  timeEl.innerHTML = start
    ? `<i class="bi bi-clock"></i> ${start}${end ? " - " + end : ""}`
    : "";

  tagEl.textContent = p.tag_title ? `#${p.tag_title}` : "";

  treeArea.innerHTML = buildNodeTreeHtml(p.nodes || []);

  modal.classList.add("show");
});

// close project detail
document.addEventListener("click", (e) => {
  if (e.target.closest("#closeProjectDetail")) {
    document.getElementById("projectDetailModal").classList.remove("show");
  }
});

// build node tree html
const norm = v => (v == null ? null : String(v));

function buildNodeTreeHtml(nodes, parentId = null, level = 0) {
  const children = nodes
    .filter(n => norm(n.parent_id) === norm(parentId))
    .sort((a, b) => a.order_index - b.order_index);

  if (!children.length) return "";

  return `
    <div class="tree-children level-${level}">
      ${children.map((n, idx) => {
        const isLast = idx === children.length - 1;

        const start = n.start_time
          ? new Date(n.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "";

        const end = n.end_time
          ? new Date(n.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "";

        const timeStr = start ? `${start}${end ? " - " + end : ""}` : "";

        return `
          <div class="tree-item ${isLast ? "is-last" : ""}">
            <div class="tree-lines">
              <span class="v-line"></span>
              <span class="h-line"></span>
            </div>

            <div class="tree-node" data-node-id="${n.node_id}">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <input type="checkbox" ${n.is_done ? "checked" : ""}>
                  <span class="${n.is_done ? "line-through text-gray-400" : ""}">
                    ${n.title}
                  </span>
                </div>

                <div class="flex items-center gap-3 text-sm text-gray-600">
                  ${timeStr ? `<span><i class="bi bi-clock"></i> ${timeStr}</span>` : ""}
                  ${n.tag_title ? `<span class="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-xs">#${n.tag_title}</span>` : ""}
                  ${n.priority ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${n.priority}</span>` : ""}
                </div>
              </div>
            </div>
          </div>

          ${buildNodeTreeHtml(nodes, n.node_id, level + 1)}
        `;
      }).join("")}
    </div>
  `;
}


// node detail
document.addEventListener("click", async (e) => {
  if (e.target.closest(".project-detail-trigger")) return;

  const node = e.target.closest(".tree-node");
  if (!node) return;

  if (e.target.tagName === "INPUT") return;

  const nodeId = node.dataset.nodeId;
  if (!nodeId) return;

  try {
    const r = await fetch(`/projects/node/${nodeId}`);
    const j = await r.json();
    if (!j.success) return;

    const modal = document.getElementById("nodeDetailModal");
    const box = document.getElementById("nodeDetailBox");

    box.innerHTML = renderNodeDetail(j.node);
    modal.classList.remove("hidden");
    modal.classList.add("show");

  } catch (err) {
    console.error("Error loading node detail", err);
  }
});




// add branch
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btnAddBranchInner")) {

    if (!currentChainId) return;

    window.currentChainIdForBranch = currentChainId;

    const projectDetailModal = document.getElementById("projectDetailModal");
    const projectDetailFormModal = document.getElementById("projectDetailFormModal");
    const taskModal = document.getElementById("taskModal");
    const form = document.getElementById("taskForm");
    const typeSelect = document.getElementById("taskTypeSelect");

    projectDetailModal?.classList.remove("show");
    projectDetailFormModal?.classList.remove("show");

    form.reset();
    delete form.dataset.editId;
    delete form.dataset.editProjectId;

    typeSelect.value = "branch";

    typeSelect.dispatchEvent(new Event("change"));
    if (typeof loadTags === "function") await loadTags();

    taskModal.classList.add("show");
    taskModal.style.opacity = "0";
    setTimeout(() => (taskModal.style.opacity = "1"), 10);
  }
});



// delete project
const deleteModal = document.getElementById("projectDeleteModal");
const btnCancelDelete = document.getElementById("cancelProjectDelete");
const btnConfirmDelete = document.getElementById("confirmProjectDelete");

const btnDelete = document.getElementById("btnDeleteProject");
if (btnDelete) {
  btnDelete.addEventListener("click", () => {
    deleteModal.classList.remove("hidden");
    deleteModal.classList.add("show");
  });
}


if (btnCancelDelete && deleteModal) {
  btnCancelDelete.addEventListener("click", () => {
    deleteModal.classList.add("hidden");
    deleteModal.classList.remove("show");
  });
}

// confirm delete
btnConfirmDelete.addEventListener("click", async () => {
  if (!deleteTarget) return;

  try {
    if (deleteTarget.type === "project") {
      const res = await fetch(`/projects/delete/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!j.success) return showToast("Delete failed", "error");

      showToast("Project deleted", "success");

      document.getElementById("projectDetailModal")?.classList.remove("show");
      document.getElementById("projectDetailFormModal")?.classList.remove("show");

      await loadProjects();
    }

    if (deleteTarget.type === "node") {
      const res = await fetch(`/projects/node/delete/${deleteTarget.id}`, {
        method: "DELETE"
      });
      const j = await res.json();
      if (!j.success) return showToast("Delete failed", "error");

      showToast("Branch deleted", "success");

      document.getElementById("nodeDetailModal")?.classList.add("hidden");
      document.getElementById("nodeDetailModal")?.classList.remove("show");

      document
        .querySelector(`.tree-node[data-node-id="${deleteTarget.id}"]`)
        ?.remove();
    }

    deleteTarget = null;
    deleteModal.classList.add("hidden");
    deleteModal.classList.remove("show");

  } catch (err) {
    console.error(err);
    showToast("Server error", "error");
  }
});



// click outside modal
document.addEventListener("click", (e) => {
  const modal = document.getElementById("projectDetailModal");
  if (modal && modal.classList.contains("show") && e.target === modal) {
    modal.classList.remove("show");
  }
});

// mở project detail form khi bấm vào tên project trong modal view project
document.addEventListener("click", async (e) => {
  const trigger = e.target.closest(".project-detail-trigger");
  if (!trigger) return;

  if (!currentChainId) return;

  try {
    const r = await fetch(`/projects/detail/${currentChainId}`);
    const j = await r.json();
    if (!j.success) return;

    const modal = document.getElementById("projectDetailFormModal");
    const box = document.getElementById("projectDetailFormBox");

    box.innerHTML = renderProjectDetail(j.project);
    modal.classList.add("show");
  } catch (err) {
    console.error("Error loading project detail", err);
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "closeProjectDetailInner") {
    document.getElementById("projectDetailFormModal").classList.remove("show");
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "deleteProjectInner") {
    document.getElementById("projectDeleteModal").classList.add("show");
    document.getElementById("projectDeleteModal").classList.remove("hidden");
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("projectDetailFormModal");
  if (!modal) return;

  if (modal.classList.contains("show") && e.target === modal) {
    modal.classList.remove("show");
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("projectDetailModal");
  if (!modal) return;

  if (modal.classList.contains("show") && e.target === modal) {
    modal.classList.remove("show");
  }
});

document.addEventListener("click", async (e) => {
  if (e.target.id === "deleteProjectInner") {
    const confirmBox = document.getElementById("projectDeleteModal");
    confirmBox.classList.add("show");
    confirmBox.classList.remove("hidden");
  }
});


document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#editProjectBtn");
  if (!btn) return;

  if (!currentChainId) return;

  // 1. Đóng cả 2 modal view detail (nếu đang mở)
  const detailView = document.getElementById("projectDetailModal");
  const detailInner = document.getElementById("projectDetailFormModal");

  if (detailView) detailView.classList.remove("show");
  if (detailInner) detailInner.classList.remove("show");

  // 2. Lấy dữ liệu project
  const r = await fetch(`/projects/detail/${currentChainId}`);
  const j = await r.json();
  if (!j.success) return;

  const p = j.project;

  await loadTags();

  // 3. Chuyển modal Add Task thành chế độ Edit Project
  const form = document.getElementById("taskForm");
  form.dataset.editProjectId = currentChainId;
  delete form.dataset.editId;

  const modal = document.getElementById("taskModal");

  // 4. Gán dữ liệu cho form
  document.getElementById("taskTypeSelect").value = "project";
  document.getElementById("taskTitle").value = p.title || "";
  document.getElementById("taskNote").value = p.description || "";

  document.getElementById("taskStartDate").value = p.start_time ? p.start_time.split("T")[0] : "";
  document.getElementById("taskEndDate").value = p.end_time ? p.end_time.split("T")[0] : "";

  document.getElementById("taskStart").value = "";
  document.getElementById("taskEnd").value = "";

  document.getElementById("taskPriority").value = p.priority || "Medium";
  document.getElementById("taskTagSelect").value = p.tag_id || "";

  // 5. Header → Edit Project
  document.querySelector("#taskModal h5").innerHTML = `
    <i class="bi bi-pencil-square text-rose-400"></i>
    Edit Project
  `;

  // 6. Ẩn các trường Task-only (project không dùng time)
  document.getElementById("taskStart").closest(".d-flex")?.classList.add("hidden");
  document.getElementById("taskStartDate").closest(".d-flex")?.classList.add("hidden");

  // 7. Mở modal edit
  modal.classList.add("show");
  modal.style.opacity = "0";
  setTimeout(() => (modal.style.opacity = "1"), 10);
});


document.addEventListener("click", (e) => {
  if (e.target.closest("#closeNodeDetailModal")) {
    const modal = document.getElementById("nodeDetailModal");
    modal.classList.add("hidden");
    modal.classList.remove("show");
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("nodeDetailModal");
  if (modal && modal.classList.contains("show") && e.target === modal) {
    modal.classList.add("hidden");
    modal.classList.remove("show");
  }
});
// delete node (branch)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-node-btn");
  if (!btn) return;

  const nodeId = btn.dataset.nodeId;
  if (!nodeId) return;

  deleteTarget = {
    type: "node",
    id: nodeId
  };

  const modal = document.getElementById("projectDeleteModal");

  modal.querySelector("h3").textContent = "Confirm Delete Branch";
  modal.querySelector("p").textContent = "Are you sure you want to delete this branch?";

  modal.classList.remove("hidden");
  modal.classList.add("show");
});

// edit branch
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".edit-node-btn");
  if (!btn) return;

  const nodeId = btn.dataset.nodeId;
  if (!nodeId) return;

  try {
    const r = await fetch(`/projects/node/${nodeId}`);
    const j = await r.json();
    if (!j.success) return;

    const n = j.node;

    // đóng modal node detail
    const nodeDetailModal = document.getElementById("nodeDetailModal");
    nodeDetailModal.classList.add("hidden");
    nodeDetailModal.classList.remove("show");

    // đóng modal view project
    const projectDetailModal = document.getElementById("projectDetailModal");
    if (projectDetailModal) {
      projectDetailModal.classList.remove("show");
    }

    // load tag list
    await loadTags();

    // chuyển task modal sang edit branch
    const form = document.getElementById("taskForm");
    const modal = document.getElementById("taskModal");

    form.reset();
    delete form.dataset.editId;
    delete form.dataset.editProjectId;

    form.dataset.editNodeId = nodeId;

    document.getElementById("taskTypeSelect").value = "branch";

    document.getElementById("taskTitle").value = n.title || "";
    document.getElementById("taskNote").value = n.note || "";

    document.getElementById("taskStartDate").value =
      n.start_time ? n.start_time.split("T")[0] : "";
    document.getElementById("taskEndDate").value =
      n.end_time ? n.end_time.split("T")[0] : "";

    document.getElementById("taskStart").value = "";
    document.getElementById("taskEnd").value = "";

    document.getElementById("taskPriority").value = n.priority || "Medium";
    document.getElementById("taskTagSelect").value = n.tag_id || "";

    document.querySelector("#taskModal h5").innerHTML = `
      <i class="bi bi-pencil-square text-rose-400"></i>
      Edit Branch
    `;

    modal.classList.add("show");
    modal.style.opacity = "0";
    setTimeout(() => (modal.style.opacity = "1"), 10);

  } catch (err) {
    console.error("error opening edit branch:", err);
  }
});

// delete project
document.addEventListener("click", (e) => {
  if (e.target.id === "deleteProjectInner" || e.target.closest("#btnDeleteProject")) {
    if (!currentChainId) return;

    deleteTarget = {
      type: "project",
      id: currentChainId
    };

    const modal = document.getElementById("projectDeleteModal");
    modal.querySelector("h3").textContent = "Confirm Delete Project";
    modal.querySelector("p").textContent =
      "Are you sure you want to delete this project?";

    modal.classList.remove("hidden");
    modal.classList.add("show");
  }
});

// add child branch
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".add-child-branch-btn");
  if (!btn) return;

  const parentId = btn.dataset.parentId;
  if (!parentId) return;
  if (!currentChainId) return;

  const nodeDetailModal = document.getElementById("nodeDetailModal");
  nodeDetailModal.classList.add("hidden");
  nodeDetailModal.classList.remove("show");

  const projectDetailModal = document.getElementById("projectDetailModal");
  if (projectDetailModal) {
    projectDetailModal.classList.remove("show");
  }

  const projectDetailFormModal = document.getElementById("projectDetailFormModal");
  if (projectDetailFormModal) {
    projectDetailFormModal.classList.remove("show");
  }

  const form = document.getElementById("taskForm");
  const modal = document.getElementById("taskModal");

  form.reset();
  delete form.dataset.editId;
  delete form.dataset.editProjectId;
  delete form.dataset.editNodeId;

  form.dataset.parentNodeId = parentId;
  window.currentChainIdForBranch = currentChainId;

  document.getElementById("taskTypeSelect").value = "branch";
  document
    .getElementById("taskTypeSelect")
    .dispatchEvent(new Event("change"));

  await loadTags();

  modal.classList.add("show");
  modal.style.opacity = "0";
  setTimeout(() => (modal.style.opacity = "1"), 10);
});



// export
window.currentChainIdForBranch = currentChainIdForBranch;
window.loadBranchTags = loadBranchTags;

