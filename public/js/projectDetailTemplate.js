export function renderProjectDetail(p) {
  const start = p.start_time
    ? new Date(p.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const end = p.end_time
    ? new Date(p.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const startDate = p.start_time ? p.start_time.split("T")[0] : "";
  const endDate   = p.end_time   ? p.end_time.split("T")[0] : "";

  const timeStr = start ? `${start}${end ? " – " + end : ""}` : "";

  return `
  <div class="task-modal-content-inner">

    <!-- HEADER (giống task-item nhưng lớn hơn) -->
    <div class="bg-white border border-pink-100 shadow-sm rounded-2xl p-4 mb-5 flex justify-between items-center">
      
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full border border-gray-300"
              style="background-color:${p.color || "#FFCACA"}"></span>

        <h3 class="font-semibold text-gray-800 text-lg">${p.title}</h3>

        ${timeStr ? `<span class="text-gray-600 text-sm"><i class="bi bi-clock"></i> ${timeStr}</span>` : ""}
        ${p.tag_title ? `<span class="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-xs">#${p.tag_title}</span>` : ""}
      </div>

      <div>
        ${p.priority ? `<span class="text-yellow-500 text-sm"><i class="bi bi-star-fill"></i> ${p.priority}</span>` : ""}
      </div>

    </div>


    <!-- DESCRIPTION -->
    <p class="italic text-gray-600 mb-6 px-1">
      ${p.description || ""}
    </p>


    <!-- GRID INFO giống Task Detail -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

      <div>
        <label class="font-medium text-sm block mb-1">Start Date</label>
        <input class="task-input w-full text-center"
               disabled value="${startDate || "(none)"}">
      </div>

      <div>
        <label class="font-medium text-sm block mb-1">End Date</label>
        <input class="task-input w-full text-center"
               disabled value="${endDate || "(none)"}">
      </div>

      <div>
        <label class="font-medium text-sm block mb-1">Start Time</label>
        <input class="task-input w-full text-center"
               disabled value="${start || "(none)"}">
      </div>

      <div>
        <label class="font-medium text-sm block mb-1">End Time</label>
        <input class="task-input w-full text-center"
               disabled value="${end || "(none)"}">
      </div>

      <div>
        <label class="font-medium text-sm block mb-1">Priority</label>
        <input class="task-input w-full text-center"
               disabled value="${p.priority || "(none)"}">
      </div>

      <div>
        <label class="font-medium text-sm block mb-1">Tag</label>
        <input class="task-input w-full text-center"
               disabled value="${p.tag_title ? "#" + p.tag_title : "(no tag)"}">
      </div>

    </div>


    <!-- ACTION BUTTONS -->
    <div class="flex justify-center gap-6 mt-4">

      <button id="btnEditProject"
              class="px-6 py-3 rounded-2xl bg-rose-200 text-rose-700 hover:bg-rose-300 transition flex flex-col items-center">
        <i class="bi bi-pencil mb-1"></i> Edit
      </button>

      <button id="btnAddBranch"
              class="px-6 py-3 rounded-2xl bg-pink-200 text-pink-700 hover:bg-pink-300 transition flex flex-col items-center">
        <i class="bi bi-node-plus mb-1"></i> Add<br>Branch
      </button>

      <button id="btnDeleteProject"
              class="px-6 py-3 rounded-2xl bg-red-200 text-red-700 hover:bg-red-300 transition flex flex-col items-center">
        <i class="bi bi-trash mb-1"></i> Delete
      </button>

    </div>

  </div>
  `;
}
