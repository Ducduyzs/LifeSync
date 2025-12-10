export function renderTaskDetail(t) {
  const start = t.start_time
    ? new Date(t.start_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const end = t.end_time
    ? new Date(t.end_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const startDate = t.start_time ? t.start_time.split("T")[0] : "";
  const endDate = t.end_time ? t.end_time.split("T")[0] : "";

  return `
  <div class="task-modal-content-inner">

    <h5 class="fw-semibold text-lg text-rose-600 flex items-center gap-2 mb-4">
      <i class="bi bi-eye-fill text-rose-400"></i>
      Task Details
    </h5>

    <form class="task-form">

      <!-- Title -->
      <div class="mb-3">
        <label class="form-label fw-medium">Task title</label>
        <input
          type="text"
          class="form-control task-input"
          value="${t.title}"
          disabled
        >
      </div>

      <!-- Note -->
      <div class="mb-3">
        <label class="form-label fw-medium">Write some note</label>
        <textarea
          class="form-control task-textarea"
          rows="3"
          disabled
        >${t.note || ""}</textarea>
      </div>

      <!-- Time row -->
      <div class="d-flex justify-content-between mb-3 gap-2">
        <div class="flex-fill">
          <label class="form-label">Start time</label>
          <input
            type="text"
            class="form-control task-input text-center"
            value="${start || ""}"
            disabled
          >
        </div>

        <div class="flex-fill">
          <label class="form-label">End time</label>
          <input
            type="text"
            class="form-control task-input text-center"
            value="${end || ""}"
            disabled
          >
        </div>
      </div>

      <!-- Date row -->
      <div class="d-flex justify-content-between mb-3 gap-2">
        <div class="flex-fill">
          <label class="form-label">Start date</label>
          <input
            type="text"
            class="form-control task-input text-center"
            value="${startDate}"
            disabled
          >
        </div>

        <div class="flex-fill">
          <label class="form-label">End date</label>
          <input
            type="text"
            class="form-control task-input text-center"
            value="${endDate}"
            disabled
          >
        </div>
      </div>

      <!-- Priority + Tag row -->
      <div class="task-priority-tag mb-3">

        <div class="priority-col">
          <label class="form-label d-block">Priority</label>
          <input
            type="text"
            class="form-control task-input text-center"
            value="${t.priority}"
            disabled
          >
        </div>

        <div class="tag-col">
          <label class="form-label d-block">Tag</label>
          <input
            type="text"
            class="form-control task-input text-center"
            value="${t.tag_title ? "#" + t.tag_title : "(no tag)"}"
            disabled
          >
        </div>

      </div>

      <!-- Buttons -->
      <div class="d-flex justify-content-center gap-3 mt-4">

        <button
          type="button"
          id="closeTaskDetailModal"
          class="btn btn-cancel"
        >
          Close
        </button>

        <button
          type="button"
          class="btn btn-save edit-task-btn"
          data-id="${t.task_id}"
        >
          Edit Task
        </button>

        <button
          type="button"
          class="btn btn-danger delete-task-btn px-4 py-2 rounded-pill"
          data-id="${t.task_id}"
        >
          <i class="bi bi-trash"></i>
        </button>

      </div>

    </form>

  </div>
  `;
}
