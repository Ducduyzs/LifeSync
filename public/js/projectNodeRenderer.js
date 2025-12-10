export function renderNodeTree(nodes, parent = null) {
  return nodes
    .filter(n => n.parent_id === parent)
    .sort((a, b) => a.order_index - b.order_index)
    .map(n => {
      const start = n.start_display || "";
      const end = n.end_display || "";

      const children = renderNodeTree(nodes, n.node_id);

      return `
        <div class="node-item mb-3">
          <div class="flex justify-between items-center bg-white rounded-xl p-3 border shadow-sm">
            <div class="flex items-center gap-3">
              <input type="checkbox" data-id="${n.node_id}" ${n.is_done ? "checked" : ""}>
              <span class="${n.is_done ? "line-through text-gray-400" : ""}">
                ${n.title}
              </span>
            </div>

            <div class="flex items-center gap-3 text-sm text-gray-600">
              ${start ? `<span><i class="bi bi-clock"></i> ${start}${end ? " – " + end : ""}</span>` : ""}
              ${n.tag_title ? `<span class="px-2 py-1 bg-pink-100 text-pink-600 rounded-lg text-xs">#${n.tag_title}</span>` : ""}
              ${n.priority ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${n.priority}</span>` : ""}
            </div>
          </div>

          ${children ? `<div class="pl-6 mt-2 border-l-2 border-gray-200">${children}</div>` : ""}
        </div>
      `;
    })
    .join("");
}

export function renderProjectChain(chain, nodes) {
  const start = chain.start_display || "";
  const end = chain.end_display || "";

  const tree = renderNodeTree(nodes);

  return `
    <div class="project-chain-item bg-white border border-pink-100 rounded-2xl p-5 shadow mb-4">

      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" style="background:${chain.color}"></span>
          <h2 class="font-bold text-lg">${chain.title}</h2>
        </div>

        <div class="flex items-center gap-4 text-sm text-gray-600">
          ${start ? `<span><i class="bi bi-clock"></i> ${start} – ${end}</span>` : ""}
          ${chain.tag_title ? `<span class="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-lg">#${chain.tag_title}</span>` : ""}
          ${chain.priority ? `<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${chain.priority}</span>` : ""}
        </div>
      </div>

      ${tree ? `<div class="mt-4 pl-4 border-l-2 border-pink-200">${tree}</div>` : ""}
    </div>
  `;
}
