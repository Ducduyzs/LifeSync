// Task Template (ES Module)
export function renderTask(t) {
  const start = t.start_time
    ? new Date(t.start_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  const end = t.end_time
    ? new Date(t.end_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  return `
    <div class="task-item flex justify-between items-center bg-white rounded-2xl shadow p-4 border border-pink-100">
      <div class="flex items-center gap-3">
        <input type="checkbox" data-id="${t.task_id}" ${t.is_done ? "checked" : ""}>
        <span class="font-medium ${t.is_done ? "line-through text-gray-400" : ""}">
          ${t.title}
        </span>
      </div>

      <div class="flex items-center gap-4 text-gray-600 text-sm">
        ${start ? `<span><i class="bi bi-clock"></i> ${start}${end ? " – " + end : ""}</span>` : ""}
        ${t.tag_title ? `<span class="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-xs">#${t.tag_title}</span>` : ""}
        ${t.priority ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${t.priority}</span>` : ""}
      </div>
    </div>
  `;
}
