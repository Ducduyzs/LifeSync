export function renderProjectDetail(p) {
  const start = p.start_time
    ? new Date(p.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const end = p.end_time
    ? new Date(p.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const startDate = p.start_time ? p.start_time.split("T")[0] : "";
  const endDate = p.end_time ? p.end_time.split("T")[0] : "";

  return `
  <div class="task-modal-content-inner">

    <h5 class="fw-semibold text-lg text-rose-600 flex items-center gap-2 mb-4">
      <i class="bi bi-diagram-3-fill text-rose-400"></i>
      Project Details
    </h5>

    <form class="task-form">

      <div class="mb-3">
        <label class="form-label fw-medium">Project Title</label>
        <input type="text" class="form-control task-input" value="${p.title}" disabled>
      </div>

      <div class="mb-3">
        <label class="form-label fw-medium">Description</label>
        <textarea class="form-control task-textarea" rows="3" disabled>${p.description || ""}</textarea>
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
          <input type="text" class="form-control task-input text-center" value="${p.priority}" disabled>
        </div>

        <div class="tag-col">
          <label class="form-label d-block">Tag</label>
          <input type="text" class="form-control task-input text-center" value="${p.tag_title ? "#" + p.tag_title : "(no tag)"}" disabled>
        </div>
      </div>

      <div class="d-flex justify-content-center gap-3 mt-4">

        <button type="button" id="closeProjectDetailInner" class="btn btn-cancel">
          Close
        </button>

        <button type="button" id="editProjectBtn" class="btn btn-save">
          Edit Project
        </button>

        <button type="button" id="btnAddBranchInner" class="btn btn-save px-4 py-2 rounded-pill">
          <i class="bi bi-node-plus"></i> Add Branch
        </button>

        <button type="button" id="deleteProjectInner" class="btn btn-danger px-4 py-2 rounded-pill">
          <i class="bi bi-trash"></i>
        </button>

      </div>

    </form>

  </div>
  `;
}
