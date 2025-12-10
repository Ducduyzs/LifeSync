// Project Chain Renderer (ES Module)

export function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function renderChain(c) {
  const start = fmtDate(c.start_time);
  const end   = fmtDate(c.end_time);
  const tag   = c.tag_title ? `#${c.tag_title}` : "";

  const pri = c.priority
    ? `<span class="text-sm px-3 py-1 rounded-pill bg-yellow-50 text-yellow-600 fw-medium">
         <i class="bi bi-star-fill"></i> ${c.priority}
       </span>`
    : "";

  return `
    <li 
      class="project-item p-4 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      data-project-id="${c.chain_id}"
    >
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full border border-gray-300"
                style="background-color:${c.color || "#FFCACA"};"></span>
          <span class="fw-semibold text-gray-700">${c.title}</span>
        </div>
        ${pri}
      </div>

      <div class="small text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mb-2">
        ${start ? `<div><i class="bi bi-calendar-event me-1"></i><strong>Start:</strong> ${start}</div>` : ""}
        ${end   ? `<div><i class="bi bi-calendar-check me-1"></i><strong>End:</strong> ${end}</div>` : ""}
        ${tag   ? `<div><i class="bi bi-tag me-1"></i><strong>Tag:</strong> ${tag}</div>` : ""}
      </div>

      ${c.description ? `<p class="fst-italic text-gray-600 ps-2">${c.description}</p>` : ""}
    </li>
  `;
}
