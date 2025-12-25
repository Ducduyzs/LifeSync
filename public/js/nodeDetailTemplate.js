export function renderNodeDetail(n) {
  const start = n.start_time
    ? new Date(n.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const end = n.end_time
    ? new Date(n.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const startDate = n.start_time ? n.start_time.split("T")[0] : "";
  const endDate = n.end_time ? n.end_time.split("T")[0] : "";

  return `
  <div class="task-modal-content-inner">

    <h5 class="fw-semibold text-lg text-rose-600 flex items-center gap-2 mb-4">
      <i class="bi bi-signpost-split-fill text-rose-400"></i>
      Branch Details
    </h5>

    <form class="task-form">

      <div class="mb-3">
        <label class="form-label fw-medium">Branch Title</label>
        <input type="text" class="form-control task-input" value="${n.title || ""}" disabled>
      </div>

      <div class="mb-3">
        <label class="form-label fw-medium">Note</label>
        <textarea class="form-control task-textarea" rows="3" disabled>${n.note || ""}</textarea>
      </div>

      <div class="d-flex justify-content-between mb-3 gap-2">
        <div class="flex-fill">
          <label class="form-label">Start time</label>
          <input type="text" class="form-control task-input text-center" value="${start}" disabled>
        </div>

        <div class="flex-fill">
          <label class="form-label">End time</label>
          <input type="text" class="form-control task-input text-center" value="${end}" disabled>
        </div>
      </div>

      <div class="d-flex justify-content-between mb-3 gap-2">
        <div class="flex-fill">
          <label class="form-label">Start date</label>
          <input type="text" class="form-control task-input text-center" value="${startDate}" disabled>
        </div>

        <div class="flex-fill">
          <label class="form-label">End date</label>
          <input type="text" class="form-control task-input text-center" value="${endDate}" disabled>
        </div>
      </div>

      <div class="task-priority-tag mb-3">
        <div class="priority-col">
          <label class="form-label d-block">Priority</label>
          <input type="text" class="form-control task-input text-center" value="${n.priority || ""}" disabled>
        </div>

        <div class="tag-col">
          <label class="form-label d-block">Tag</label>
          <input type="text" class="form-control task-input text-center" value="${n.tag_title ? "#" + n.tag_title : "(no tag)"}" disabled>
        </div>
      </div>

      <div class="d-flex justify-content-center gap-3 mt-4">

        <button type="button" id="closeNodeDetailModal" class="btn btn-cancel">
          Close
        </button>

        <button
          type="button"
          class="btn btn-save edit-node-btn"
          data-node-id="${n.node_id}"
        >
          Edit Branch
        </button>

        <button
          type="button"
          class="btn btn-save px-4 py-2 rounded-pill add-child-branch-btn"
          data-parent-id="${n.node_id}"
        >
          <i class="bi bi-node-plus"></i> Add Branch
        </button>

        <button
          type="button"
          class="btn btn-danger px-4 py-2 rounded-pill delete-node-btn"
          data-node-id="${n.node_id}"
        >
          <i class="bi bi-trash"></i>
        </button>

      </div>

    </form>

  </div>
  `;
}
