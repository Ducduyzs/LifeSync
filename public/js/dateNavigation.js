import { renderTask } from "/js/taskTemplate.js";
import { renderChain } from "/js/projectChains.js";

// ------------------ Helpers ------------------
function ymd(d) {
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function fmtTitle(d) {
  return `My Day – ${d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

// ------------------ MAIN ------------------
document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prevDate");
  const nextBtn = document.getElementById("nextDate");
  const todayBtn = document.getElementById("todayBtn");

  const titleEl = document.getElementById("dateTitle");
  const listEl = document.getElementById("taskList");

  const projectEl =
    document.querySelector(".project-tree ul") ||
    document.querySelector(".project-tree");

  let current = new Date();
  const today = new Date();

  async function load() {
    titleEl.textContent = fmtTitle(current);

    if (ymd(current) === ymd(today)) todayBtn.classList.add("active");
    else todayBtn.classList.remove("active");

    // LOAD TASKS (fetch chuẩn module)
    try {
      const r = await fetch(`/tasks/list?date=${ymd(current)}&sort=start`);
      const j = await r.json();

      if (!j.success || !j.tasks?.length) {
        listEl.innerHTML = `<p class="text-gray-500 text-center fst-italic mt-3">
          No tasks for this date
        </p>`;
      } else {
        listEl.innerHTML = j.tasks.map(renderTask).join("");
      }
    } catch (e) {
      listEl.innerHTML = `<p class="text-gray-500 fst-italic">Failed to load tasks</p>`;
    }

    // LOAD PROJECT CHAINS (dùng template)
    if (projectEl) {
      projectEl.innerHTML = `<div class="text-gray-500">Loading projects...</div>`;

      try {
        const r2 = await fetch(`/projects/list?date=${ymd(current)}`);
        const j2 = await r2.json();

        if (!j2.success || !j2.chains?.length) {
          projectEl.innerHTML = `<p class="text-gray-400 text-center fst-italic mt-2">
            <i class="bi bi-tree"></i> No project chains for this day
          </p>`;
        } else {
          projectEl.innerHTML = j2.chains.map(renderChain).join("");
        }
      } catch (e) {
        projectEl.innerHTML = `<div class="text-gray-500">Failed to load projects</div>`;
      }
    }
  }

  // ------------------ Navigation ------------------
  prevBtn?.addEventListener("click", () => {
    current.setDate(current.getDate() - 1);
    load();
    document.dispatchEvent(new CustomEvent("dateChanged", {
      detail: ymd(current)
    }));
  });

  nextBtn?.addEventListener("click", () => {
    current.setDate(current.getDate() + 1);
    load();
    document.dispatchEvent(new CustomEvent("dateChanged", {
      detail: ymd(current)
    }));
  });

  todayBtn?.addEventListener("click", () => {
    current = new Date();
    load();
    document.dispatchEvent(new CustomEvent("dateChanged", {
      detail: ymd(current)
    }));
  });

  document.addEventListener("taskAdded", () => load());
  document.addEventListener("projectAdded", () => load());

  load();
});
