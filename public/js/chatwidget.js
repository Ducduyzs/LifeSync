const chatFab = document.getElementById("chatFab");
const chatPanel = document.getElementById("chatPanel");
const chatClose = document.getElementById("chatClose");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

// simple chat state
window.__CHAT_STATE__ = {
  awaiting: null,
  draft: null
};

function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.remove("hidden");
  setTimeout(() => chatInput?.focus(), 0);
}

function closeChat() {
  if (!chatPanel) return;
  chatPanel.classList.add("hidden");
}

function appendBubble(text, side = "user") {
  if (!chatBody) return;

  const wrap = document.createElement("div");

  if (side === "user") {
    wrap.className = "flex justify-end";
    wrap.innerHTML = `
      <div class="max-w-[240px] rounded-2xl rounded-tr-md bg-rose-500 px-3 py-2 text-sm text-white">
        ${escapeHtml(text)}
      </div>
    `;
  } else {
    wrap.className = "flex items-start gap-2";
    wrap.innerHTML = `
      <div class="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
        <i class="bi bi-robot text-gray-500 text-sm"></i>
      </div>
      <div class="max-w-[240px] rounded-2xl rounded-tl-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
        ${escapeHtml(text)}
      </div>
    `;
  }

  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

//event bindings with null guards

chatFab?.addEventListener("click", e => {
  e.stopPropagation();
  if (!chatPanel) return;
  chatPanel.classList.contains("hidden") ? openChat() : closeChat();
});

chatClose?.addEventListener("click", e => {
  e.stopPropagation();
  closeChat();
});

document.addEventListener("click", () => {
  if (!chatPanel) return;
  if (!chatPanel.classList.contains("hidden")) closeChat();
});

chatPanel?.addEventListener("click", e => e.stopPropagation());

//single submit handler

chatForm?.addEventListener("submit", async e => {
  e.preventDefault();

  const msg = chatInput?.value.trim();
  if (!msg) return;

  appendBubble(msg, "user");
  chatInput.value = "";

  try {
    const res = await fetch("/api/chat/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });

    const data = await res.json();

    if (data.intent === "clarify_task_time" || data.intent === "clarify_project_time") {
      window.__CHAT_STATE__.awaiting = data.intent;
      appendBubble(data.question, "bot");
      return;
    }

    if (data.intent === "create_task") {
      await openAddTaskFromAI(data);
      window.__CHAT_STATE__ = { awaiting: null, draft: null };
      return;
    }

    if (data.intent === "create_project") {
      await openAddProjectFromAI(data);
      window.__CHAT_STATE__ = { awaiting: null, draft: null };
      return;
    }

    appendBubble(data.reply || "ok", "bot");
  } catch {
    appendBubble("connection error", "bot");
  }
});

/* task */

async function openAddTaskFromAI(data) {
  const modal = document.getElementById("taskModal");
  if (!modal) return;

  modal.classList.add("show");
  modal.classList.remove("hidden");

  const titleInput = document.getElementById("taskTitle");
  if (titleInput) titleInput.value = data.title || "";

  const duration = Number(data.estimated_duration_minutes || 30);

  const start = new Date();
  const end = new Date(start.getTime() + duration * 60000);

  const formatDate = d => d.toISOString().slice(0, 10);
  const formatTime = d => d.toTimeString().slice(0, 5);

  const startDate = document.getElementById("taskStartDate");
  const startTime = document.getElementById("taskStart");
  const endDate = document.getElementById("taskEndDate");
  const endTime = document.getElementById("taskEnd");

  if (startDate) startDate.value = formatDate(start);
  if (startTime) startTime.value = formatTime(start);
  if (endDate) endDate.value = formatDate(end);
  if (endTime) endTime.value = formatTime(end);

  if (typeof window.loadTags === "function") {
    await window.loadTags();
  }

  if (Array.isArray(data.tags)) {
    const select = document.getElementById("taskTagSelect");
    if (select) {
      for (const opt of select.options) {
        if (data.tags.some(t => t.toLowerCase() === opt.textContent.toLowerCase())) {
          select.value = opt.value;
          break;
        }
      }
    }
  }

  appendBubble("I’ve prepared the task. Please review and save.", "bot");
}

/* project */

async function openAddProjectFromAI(data) {
  const modal = document.getElementById("taskModal");
  if (!modal) return;

  modal.classList.add("show");
  modal.classList.remove("hidden");

  const typeSelect = document.getElementById("taskTypeSelect");
  if (typeSelect) typeSelect.value = "project";

  const titleInput = document.getElementById("taskTitle");
  if (titleInput) titleInput.value = data.name || "";

  const noteInput = document.getElementById("taskNote");
  if (noteInput) noteInput.value = data.description || "";

  const days = Number(data.estimated_duration_days || 7);

  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

  const formatDate = d => d.toISOString().slice(0, 10);

  const startDate = document.getElementById("taskStartDate");
  const endDate = document.getElementById("taskEndDate");

  if (startDate) startDate.value = formatDate(start);
  if (endDate) endDate.value = formatDate(end);

  if (typeof window.loadTags === "function") {
    await window.loadTags();
  }

  if (Array.isArray(data.tags)) {
    const select = document.getElementById("taskTagSelect");
    if (select) {
      for (const opt of select.options) {
        if (data.tags.some(t => t.toLowerCase() === opt.textContent.toLowerCase())) {
          select.value = opt.value;
          break;
        }
      }
    }
  }

  appendBubble("I’ve prepared a project. Please review and save.", "bot");
}
