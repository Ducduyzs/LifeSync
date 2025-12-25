const norm = (v) => (v == null ? null : String(v));

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
