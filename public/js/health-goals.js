// Health Goals & Streaks UI
async function fetchGoals() {
  try {
    const res = await fetch('/health/goals');
    const data = await res.json();
    return data.success ? data.goals : [];
  } catch (err) {
    console.error('Error fetching goals', err);
    showToast('Error fetching goals', 'error');
    return [];
  }
}

function renderProgressBar(percent) {
  const pct = Math.max(0, Math.min(100, percent || 0));
  return `
    <div class="goal-progress" aria-hidden>
      <div class="goal-progress-fill" style="width: ${pct}%"></div>
      <div class="goal-progress-label">${pct}%</div>
    </div>
  `;
}

function formatGoalType(t) {
  switch (t) {
    case 'steps': return 'Steps';
    case 'calories': return 'Calories';
    case 'water': return 'Water (L)';
    case 'sleep': return 'Sleep (h)';
    default: return t;
  }
}

function renderGoals(goals) {
  const container = document.getElementById('goalsContainer');
  if (!container) return;
  if (!goals || goals.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align:center;">No goals set yet. Add one!</p>';
    return;
  }

  let html = '<div class="goals-list">';
  goals.forEach(g => {
    html += `
      <div class="goal-item" data-id="${g.id}">
        <div class="goal-left">
          <div class="goal-title">${formatGoalType(g.goal_type)} <span class="goal-period">(${g.period})</span></div>
          <div class="goal-target">Target: <strong>${g.target}</strong></div>
          ${renderProgressBar(g.progress || 0)}
          ${g.start_date && g.end_date ? `<div class="goal-range">${g.start_date} → ${g.end_date} ${g.require_each_day ? '<span class="require-badge">(daily)</span>' : ''}</div>` : ''}
          ${g.total_days ? `<div class="goal-days">Days: <strong>${g.days_met ?? 0}/${g.total_days}</strong></div>` : ''}
        </div>
        <div class="goal-right">
          <div class="goal-stats">${g.value ?? 0} ${g.goal_type === 'water' ? 'L' : g.goal_type === 'sleep' ? 'h' : ''}</div>
          <div class="streak-badge">🔥 ${g.streak ?? 0}</div>
          ${g.achieved ? `<div class="goal-done">✅ Done</div>` : ''}
          <div class="goal-actions">
            <button class="btn-small" onclick="openEditGoal(${g.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn-small delete" onclick="deleteGoal(${g.id})"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function openAddGoalModal() {
  const html = `
    <div class="modal-overlay" id="goalModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="bi bi-award"></i> Add Goal</h3>
          <button class="modal-close" onclick="closeModal('goalModal')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="goalForm">
            <div class="form-group">
              <label>Type *</label>
              <select id="goalType" required>
                <option value="steps">Steps</option>
                <option value="calories">Calories</option>
                <option value="water">Water</option>
                <option value="sleep">Sleep</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target *</label>
              <input type="number" id="goalTarget" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>Period *</label>
              <select id="goalPeriod" required>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div class="form-group">
              <label>Start Date (optional)</label>
              <input type="date" id="goalStartDate" />
            </div>
            <div class="form-group">
              <label>End Date (optional)</label>
              <input type="date" id="goalEndDate" />
            </div>
            <div class="form-group">
              <label><input type="checkbox" id="goalRequireEachDay" /> Require daily target for every day in range</label>
            </div>
            <div class="form-actions">
              <button type="submit" class="health-btn-primary">Save Goal</button>
              <button type="button" class="health-btn-ghost" onclick="closeModal('goalModal')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  const modal = document.getElementById('goalModal');
  if (modal) {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.querySelector('.modal-close')?.setAttribute('aria-label', 'Close add goal modal');
    modal._releaseFocus = trapFocus(modal, '#goalType');
  }

  document.getElementById('goalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const startDate = document.getElementById('goalStartDate').value || null;
    const endDate = document.getElementById('goalEndDate').value || null;
    const requireEach = !!document.getElementById('goalRequireEachDay').checked;

    // client-side validation for date range
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      showToast('End date must be the same or after start date', 'error');
      return;
    }

    const payload = {
      goal_type: document.getElementById('goalType').value,
      target: document.getElementById('goalTarget').value,
      period: document.getElementById('goalPeriod').value,
      start_date: startDate,
      end_date: endDate,
      require_each_day: requireEach
    };
    try {
      const res = await fetch('/health/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeModal('goalModal');
        showToast('Goal saved.', 'success');
        loadGoals();
      } else {
        showToast('Error: ' + data.message, 'error');
      }
    } catch (err) {
      console.error('Error saving goal', err);
      showToast('Error saving goal', 'error');
    }
  });
}

async function openEditGoal(id) {
  // get latest goal object
  const goals = await fetchGoals();
  const g = goals.find(x => x.id === id);
  if (!g) return;

  const html = `
    <div class="modal-overlay" id="goalEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="bi bi-pencil"></i> Edit Goal</h3>
          <button class="modal-close" onclick="closeModal('goalEditModal')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="goalEditForm">
            <div class="form-group">
              <label>Type *</label>
              <select id="editGoalType" required disabled>
                <option value="steps">Steps</option>
                <option value="calories">Calories</option>
                <option value="water">Water</option>
                <option value="sleep">Sleep</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target *</label>
              <input type="number" id="editGoalTarget" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>Period *</label>
              <select id="editGoalPeriod" required>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div class="form-group">
              <label>Start Date (optional)</label>
              <input type="date" id="editGoalStartDate" />
            </div>
            <div class="form-group">
              <label>End Date (optional)</label>
              <input type="date" id="editGoalEndDate" />
            </div>
            <div class="form-group">
              <label><input type="checkbox" id="editGoalRequireEachDay" /> Require daily target for every day in range</label>
            </div>
            <div class="form-actions">
              <button type="submit" class="health-btn-primary">Update Goal</button>
              <button type="button" class="health-btn-ghost" onclick="closeModal('goalEditModal')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  const modal = document.getElementById('goalEditModal');
  if (modal) {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.querySelector('.modal-close')?.setAttribute('aria-label', 'Close edit goal modal');
    modal._releaseFocus = trapFocus(modal, '#editGoalTarget');
  }

  document.getElementById('editGoalType').value = g.goal_type;
  document.getElementById('editGoalTarget').value = g.target;
  document.getElementById('editGoalPeriod').value = g.period;
  document.getElementById('editGoalStartDate').value = g.start_date || '';
  document.getElementById('editGoalEndDate').value = g.end_date || '';
  document.getElementById('editGoalRequireEachDay').checked = !!g.require_each_day;

  document.getElementById('goalEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const startDate = document.getElementById('editGoalStartDate').value || null;
    const endDate = document.getElementById('editGoalEndDate').value || null;
    const requireEach = !!document.getElementById('editGoalRequireEachDay').checked;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      showToast('End date must be the same or after start date', 'error');
      return;
    }

    const payload = {
      id: g.id,
      goal_type: document.getElementById('editGoalType').value,
      target: document.getElementById('editGoalTarget').value,
      period: document.getElementById('editGoalPeriod').value,
      start_date: startDate,
      end_date: endDate,
      require_each_day: requireEach
    };
    try {
      const res = await fetch('/health/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeModal('goalEditModal');
        showToast('Goal updated.', 'success');
        loadGoals();
      } else {
        showToast('Error: ' + data.message, 'error');
      }
    } catch (err) {
      console.error('Error updating goal', err);
      showToast('Error updating goal', 'error');
    }
  });
}

async function deleteGoal(id) {
  const ok = await showConfirm('Are you sure you want to delete this goal?');
  if (!ok) return;
  try {
    const res = await fetch(`/health/goals/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Goal removed.', 'success');
      loadGoals();
    } else {
      showToast('Error: ' + data.message, 'error');
    }
  } catch (err) {
    console.error('Error deleting goal', err);
    showToast('Error deleting goal', 'error');
  }
}

async function loadGoals() {
  const goals = await fetchGoals();
  renderGoals(goals);
}

// Initialization
function initGoals() {
  document.getElementById('btnAddGoal')?.addEventListener('click', openAddGoalModal);
  loadGoals();
}

// Expose functions so inline onclick works
window.openEditGoal = openEditGoal;
window.deleteGoal = deleteGoal;

// Auto init
document.addEventListener('DOMContentLoaded', () => {
  initGoals();
});