// INIT
import { renderChain, fmtDate } from "/js/projectChains.js";
import { renderTask } from "/js/taskTemplate.js";
import { renderTaskDetail } from "/js/taskDetailTemplate.js";

document.addEventListener("DOMContentLoaded", () => {

  // ELEMENTS
  const modal = document.getElementById("taskModal");
  const openBtns = document.querySelectorAll("#openTaskModal, .btn-add-task");
  const closeBtn = document.getElementById("closeTaskModal");
  const form = document.getElementById("taskForm");
  const tagSelect = document.getElementById("taskTagSelect");
  const taskList = document.getElementById("taskList");
  let deleteTaskId = null;

  // CHECKBOX UPDATE
  if (taskList) {
    taskList.addEventListener("change", async (e) => {
      if (e.target.type !== "checkbox") return;
      const taskId = e.target.dataset.id;
      if (!taskId) return;
      const isDone = e.target.checked;
      const titleEl = e.target.closest(".flex")?.querySelector(".font-medium");
      if (titleEl) {
        titleEl.classList.toggle("line-through", isDone);
        titleEl.classList.toggle("text-gray-400", isDone);
      }
      try {
        const res = await fetch(`/tasks/toggle/${taskId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_done: isDone }),
        });
        const result = await res.json();
        if (!result.success) console.error("Update failed:", result.message);
      } catch (error) {
        console.error("Error updating task:", error);
      }
    });
  }

  // GLOBAL STATE
  const taskTypeSelect = document.getElementById("taskTypeSelect");
  const timeRow = document.querySelector(".time-row");
  const dateRow = document.querySelector(".date-row");
  let currentSort = "start";
  let now = new Date();
  now.setHours(now.getHours() + 7);
  let currentDate = now.toISOString().split("T")[0];

  document.addEventListener("dateChanged", (e) => {
    currentDate = e.detail;
  });

  // TOAST
  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  toastContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2000;
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
    }, 4000);
  }

  // OPEN MODAL
  openBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      form.reset();
      delete form.dataset.editId;
      modal.classList.add("show");
      modal.style.opacity = "0";
      setTimeout(() => (modal.style.opacity = "1"), 10);
      await loadTags();
      setDefaultDateTime();
    });
  });

  // CLOSE MODAL
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.classList.remove("show");
      modal.style.opacity = "";
    }, 150);
  }

  // DEFAULT DATETIME
  function setDefaultDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const startDate = document.getElementById("taskStartDate");
    const endDate = document.getElementById("taskEndDate");
    const startTime = document.getElementById("taskStart");
    const endTime = document.getElementById("taskEnd");

    if (taskTypeSelect.value === "task") {
      startDate.value = dateStr;
      startTime.value = timeStr;
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      endDate.value = end.toISOString().split("T")[0];
      endTime.value = end.toTimeString().slice(0, 5);
    } else {
      startDate.value = dateStr;
      endDate.value = dateStr;
      startTime.value = "";
      endTime.value = "";
    }
  }

  // SWITCH TASK / PROJECT
  taskTypeSelect.addEventListener("change", () => {
    const startTime = document.getElementById("taskStart");
    const endTime = document.getElementById("taskEnd");
    const startDate = document.getElementById("taskStartDate");
    const endDate = document.getElementById("taskEndDate");

    if (taskTypeSelect.value === "project") {
      timeRow?.classList.add("hidden");
      dateRow?.classList.add("hidden");
      startTime.value = "";
      endTime.value = "";
      startDate.value = "";
      endDate.value = "";
    } else {
      timeRow?.classList.remove("hidden");
      dateRow?.classList.remove("hidden");
      setDefaultDateTime();
    }
  });

  // LOAD TAGS
  async function loadTags() {
    if (!tagSelect) return;
    try {
      const res = await fetch("/tags/list");
      const data = await res.json();
      tagSelect.innerHTML = `<option value="">-- No tag --</option>`;
      if (data.success)
        data.tags.forEach((tag) => {
          const op = document.createElement("option");
          op.value = tag.tag_id;
          op.textContent = tag.title;
          tagSelect.appendChild(op);
        });
    } catch {
      tagSelect.innerHTML = `<option value="">-- No tag --</option>`;
    }
  }
  window.loadTags = loadTags;
  // SEND DATA
  async function sendData(url, data, label, forceDate = null) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`${label} added successfully!`, "success");
        closeModal();
        form.reset();
        if (label === "Project Chain") {
          await loadProjects();
        } else {
          await loadTasks(forceDate);
        }
      } else {
        showToast(`Failed to add ${label}.`, "error");
      }
    } catch (err) {
      console.error(`Error adding ${label}:`, err);
      showToast(`Server error while adding ${label}.`, "error");
    }
  }

  // FORM SUBMIT
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const editId = form.dataset.editId;
    const type = taskTypeSelect.value;

    const taskData = {
      title: document.getElementById("taskTitle").value.trim(),
      note: document.getElementById("taskNote").value.trim(),
      start_time: document.getElementById("taskStart").value || null,
      end_time: document.getElementById("taskEnd").value || null,
      start_date: document.getElementById("taskStartDate")?.value || null,
      end_date: document.getElementById("taskEndDate")?.value || null,
      priority: document.getElementById("taskPriority").value,
      tag_id: tagSelect.value || null,
    };

    if (!taskData.title)
      return showToast("Please enter a title.", "warning");

    if (editId && type === "task") {
      const r = await fetch(`/tasks/update/${editId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const j = await r.json();
      if (j.success) {
        showToast("Task updated successfully!", "success");
        delete form.dataset.editId;
        modal.classList.remove("show");
        await loadTasks();
        return;
      } else {
        return showToast("Failed to update task.", "error");
      }
    }

    if (type === "task") {
      await sendData("/tasks/add", taskData, "Task", taskData.start_date);
      return;
    }

    if (type === "project") {
      const projectData = {
        title: taskData.title,
        description: taskData.note,
        color: "#FFCACA",
        priority: taskData.priority,
        start_time: taskData.start_date,
        end_time: taskData.end_date,
        tag_id: taskData.tag_id,
      };
      await sendData("/projects/add", projectData, "Project Chain");
      return;
    }
  });

  // LOAD TASKS
  async function loadTasks(forceDate = null) {
    try {
      if (forceDate) currentDate = forceDate;
      const dateParam = forceDate || currentDate;
      const res = await fetch(`/tasks/list?date=${dateParam}&sort=${currentSort}`);
      const data = await res.json();
      if (!data.success || !taskList) return;

      taskList.innerHTML = "";

      if (!data.tasks.length) {
        taskList.innerHTML = `
          <p class="text-gray-500 text-center fst-italic mt-3">
            <i class="bi bi-cloud-drizzle"></i> No tasks for this date 🌤
          </p>`;
        return;
      }

      taskList.innerHTML = data.tasks.map(renderTask).join("");
    } catch (err) {
      console.error("Error loading tasks:", err);
      if (taskList) {
        taskList.innerHTML = `
          <p class="text-red-500 text-center fst-italic mt-3">
            Failed to load tasks.
          </p>`;
      }
    }
  }

  // EXPORT LOAD TASKS GLOBAL
  window.loadTasks = loadTasks;

  // UPDATE DONE STATUS
  async function updateTaskStatus(taskId, isDone) {
    try {
      const res = await fetch(`/tasks/toggle/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: isDone }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(isDone ? "Task done!" : "Task undone.", "success");
        await loadTasks();
      } else {
        showToast("Failed to update.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error.", "error");
    }
  }

  // LOAD PROJECTS
  async function loadProjects(forceDate = null) {
    const container =
      document.querySelector(".project-tree ul") ||
      document.querySelector(".project-tree");
    if (!container) return;

    const dateParam = forceDate || currentDate;
    container.innerHTML = `<div class="text-gray-500">Loading...</div>`;

    try {
      const res = await fetch(`/projects/list?date=${dateParam}`);
      const data = await res.json();
      if (!data.success || !data.chains?.length) {
        container.innerHTML = `
          <p class="text-gray-400 text-center fst-italic mt-2">
            <i class="bi bi-tree"></i> No project chains for this day
          </p>`;
        return;
      }
      container.innerHTML = data.chains.map(renderChain).join("");
    } catch (err) {
      console.error("Error loading projects:", err);
      container.innerHTML = `<div class="text-gray-500">Failed to load projects</div>`;
    }
  }

  // EXPORT LOAD PROJECTS GLOBAL
  window.loadProjects = loadProjects;

  // SORTING
  document.querySelectorAll("[data-sort]").forEach((icon) => {
    icon.addEventListener("click", async (e) => {
      currentSort = e.currentTarget.dataset.sort;
      document.querySelectorAll("[data-sort]").forEach((i) =>
        i.classList.remove("text-pink-500")
      );
      e.currentTarget.classList.add("text-pink-500");
      await loadTasks(currentDate);
    });
  });

// TASK DETAIL MODAL
document.addEventListener("click", async (e) => {

  if (e.target.closest("input[type='checkbox']")) return;

  if (e.target.closest(".edit-task-btn") || e.target.closest(".delete-task-btn")) return;

  const item = e.target.closest(".task-item");
  if (!item) return;

  const checkbox = item.querySelector("input[type='checkbox']");
  const taskId = checkbox?.dataset.id;
  if (!taskId) return;

  try {
    const r = await fetch(`/tasks/detail/${taskId}`);
    const j = await r.json();
    if (!j.success) return;

    const detailModal = document.getElementById("taskDetailModal");
    const detailBox = document.getElementById("taskDetailBox");

    detailBox.innerHTML = renderTaskDetail(j.task);

    detailModal.classList.remove("hidden");
    detailModal.classList.add("show");

  } catch (err) {
    console.error("Error loading detail:", err);
  }
});


  // TASK DETAIL CLOSE
  const detailModal = document.getElementById("taskDetailModal");
  const closeDetail = document.getElementById("closeTaskDetailModal");

  if (closeDetail) {
    closeDetail.addEventListener("click", () => {
      detailModal.classList.add("hidden");
      detailModal.classList.remove("show");
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      detailModal.classList.add("hidden");
      detailModal.classList.remove("show");
    }
  });

  // DELETE CONFIRM ACTION
  document.getElementById("confirmDelete").addEventListener("click", async () => {
    if (!deleteTaskId) return;
    try {
      const res = await fetch(`/tasks/delete/${deleteTaskId}`, { method: "DELETE" });
      const j = await res.json();
      if (j.success) {
        const deleteModal = document.getElementById("deleteConfirmModal");
        const detailModal = document.getElementById("taskDetailModal");
        deleteModal.classList.add("hidden");
        deleteModal.classList.remove("show");
        detailModal.classList.add("hidden");
        detailModal.classList.remove("show");
        showToast("Task deleted successfully!", "success");
        await loadTasks();
      } else {
        showToast("Failed to delete task.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error while deleting task.", "error");
    }
  });

  // OPEN DELETE POPUP
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-task-btn");
    if (!btn) return;
    deleteTaskId = btn.dataset.id;
    const popup = document.getElementById("deleteConfirmModal");
    popup.classList.remove("hidden");
    popup.classList.add("show");
  });

  // CANCEL DELETE POPUP
  document.getElementById("cancelDelete").addEventListener("click", () => {
    const popup = document.getElementById("deleteConfirmModal");
    popup.classList.add("hidden");
    popup.classList.remove("show");
  });

  // EDIT TASK POPUP
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".edit-task-btn");
    if (!btn) return;
    const id = btn.dataset.id;

    try {
      const r = await fetch(`/tasks/detail/${id}`);
      const j = await r.json();
      if (!j.success) return;
      const t = j.task;

      await loadTags();

      document.getElementById("taskTitle").value = t.title || "";
      document.getElementById("taskNote").value = t.note || "";
      document.getElementById("taskStart").value =
        t.start_time ? t.start_time.split("T")[1].slice(0, 5) : "";
      document.getElementById("taskEnd").value =
        t.end_time ? t.end_time.split("T")[1].slice(0, 5) : "";
      document.getElementById("taskStartDate").value =
        t.start_time ? t.start_time.split("T")[0] : "";
      document.getElementById("taskEndDate").value =
        t.end_time ? t.end_time.split("T")[0] : "";
      document.getElementById("taskPriority").value = t.priority || "Medium";
      tagSelect.value = t.tag_id || "";

      form.dataset.editId = id;

      detailModal.classList.add("hidden");
      detailModal.classList.remove("show");

      modal.classList.remove("hidden");
      modal.classList.add("show");
      modal.style.opacity = "0";
      setTimeout(() => (modal.style.opacity = "1"), 10);

    } catch (err) {
      console.error("Error opening edit form:", err);
    }
  });

  // INIT LOAD
  loadTasks();
  loadProjects();
});
