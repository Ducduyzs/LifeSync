document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("taskModal");
  const openBtns = document.querySelectorAll("#openTaskModal, .btn-add-task");
  const closeBtn = document.getElementById("closeTaskModal");
  const form = document.getElementById("taskForm");
  const tagSelect = document.getElementById("taskTagSelect");
  const taskList = document.getElementById("taskList");

  // 🌸 Mở modal Add Task
  openBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      modal.classList.add("show");
      await loadTags(); // load danh sách tag khi mở form
    });
  });

  // 🌸 Đóng modal khi nhấn Cancel
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }

  // 🌸 Đóng khi click ra ngoài popup
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });

  // 🌸 Hàm load danh sách tag
  async function loadTags() {
    if (!tagSelect) return;
    try {
      const res = await fetch("/tags/list");
      const data = await res.json();
      tagSelect.innerHTML = "";

      if (data.success && data.tags.length > 0) {
        tagSelect.innerHTML = `<option value="">-- Select tag --</option>`;
        data.tags.forEach((tag) => {
          const option = document.createElement("option");
          option.value = tag.tag_id;
          option.textContent = tag.title;
          option.style.backgroundColor = tag.color;
          option.dataset.color = tag.color;
          tagSelect.appendChild(option);
        });
      } else {
        tagSelect.innerHTML = `<option value="">(No tags yet)</option>`;
      }
    } catch (error) {
      console.error("❌ Error loading tags:", error);
      tagSelect.innerHTML = `<option value="">Error loading tags</option>`;
    }
  }

  // 🌸 Thêm task vào database
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskData = {
      title: document.getElementById("taskTitle").value.trim(),
      note: document.getElementById("taskNote").value.trim(),
      start_time: document.getElementById("taskStart").value || null,
      end_time: document.getElementById("taskEnd").value || null,
      priority: document.getElementById("taskPriority").value,
      tag_id: tagSelect ? tagSelect.value || null : null,
    };

    if (!taskData.title) {
      alert("⚠️ Please enter a task title.");
      return;
    }

    try {
      const res = await fetch("/tasks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const result = await res.json();

      if (result.success) {
        modal.classList.remove("show");
        form.reset();
        await loadTasks(); // ✅ Load lại danh sách ngay sau khi thêm
      } else {
        alert("❌ Failed to add task. Please try again.");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      alert("⚠️ Something went wrong while adding the task.");
    }
  });

  // 🌸 Tự động load danh sách task
  async function loadTasks() {
    try {
      const res = await fetch("/tasks/list");
      const data = await res.json();
      if (!data.success) return;

      taskList.innerHTML = "";

      if (data.tasks.length === 0) {
        taskList.innerHTML = `<p class="text-gray-500">No tasks for today yet 🌤</p>`;
        return;
      }

      data.tasks.forEach((task) => {
        const div = document.createElement("div");
        div.className =
          "task-item flex justify-between items-center bg-white rounded-2xl shadow p-4 border border-pink-100";

        div.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" ${task.is_done ? "checked" : ""}>
            <span class="font-medium">${task.title}</span>
          </div>
          <div class="flex items-center gap-4 text-gray-600 text-sm">
            <span><i class="bi bi-clock"></i> ${formatTime(task.start_time)}–${formatTime(task.end_time)}</span>
            ${
              task.tag_title
                ? `<span class="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-xs">#${task.tag_title}</span>`
                : ""
            }
            ${
              task.priority
                ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${task.priority}</span>`
                : ""
            }
          </div>
        `;
        taskList.appendChild(div);
      });
    } catch (error) {
      console.error("❌ Error loading tasks:", error);
    }
  }

  // 🌸 Format giờ (HH:mm → 12h AM/PM)
  function formatTime(ts) {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 🌸 Gọi khi load trang
  loadTasks();

  document.addEventListener("tagAdded", loadTags);
});
