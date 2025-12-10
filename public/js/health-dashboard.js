// Load Chart.js library
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
document.head.appendChild(chartScript);

// Health Status Today
async function loadHealthStatusToday() {
  try {
    const response = await fetch('/health/health-status-today');
    const result = await response.json();

    if (result.success && result.hasData) {
      const { today, bmi, comparison, userProfile } = result;
      let html = '<div class="health-status-grid">';

      // Sleep
      if (today.sleep_hours) {
        let sleepIcon = 'bi-dash';
        if (comparison.sleep === 'improved') sleepIcon = 'bi-graph-up';
        else if (comparison.sleep === 'declined') sleepIcon = 'bi-graph-down';
        html += `<div class="health-status-item">
          <i class="bi bi-moon-stars"></i>
          <div class="health-status-info">
            <p class="label">Sleep</p>
            <p class="value">${today.sleep_hours}h <i class="bi ${sleepIcon}" style="font-size: 0.9em;"></i></p>
          </div>
        </div>`;
      }

      // Steps
      if (today.steps) {
        let stepsIcon = 'bi-dash';
        if (comparison.steps === 'improved') stepsIcon = 'bi-graph-up';
        else if (comparison.steps === 'declined') stepsIcon = 'bi-graph-down';
        html += `<div class="health-status-item">
          <i class="bi bi-activity"></i>
          <div class="health-status-info">
            <p class="label">Steps</p>
            <p class="value">${today.steps} <i class="bi ${stepsIcon}" style="font-size: 0.9em;"></i></p>
          </div>
        </div>`;
      }

      // Calories
      if (today.calories) {
        const caloriesIcon = comparison.calories === 'increased' ? 'bi-graph-up' : 'bi-graph-down';
        html += `<div class="health-status-item">
          <i class="bi bi-fire"></i>
          <div class="health-status-info">
            <p class="label">Calories</p>
            <p class="value">${today.calories} kcal <i class="bi ${caloriesIcon}" style="font-size: 0.9em;"></i></p>
          </div>
        </div>`;
      }

      // Water
      if (today.water_intake) {
        let waterIcon = 'bi-dash';
        if (comparison.water === 'improved') waterIcon = 'bi-graph-up';
        else if (comparison.water === 'declined') waterIcon = 'bi-graph-down';
        html += `<div class="health-status-item">
          <i class="bi bi-water"></i>
          <div class="health-status-info">
            <p class="label">Water</p>
            <p class="value">${today.water_intake}L <i class="bi ${waterIcon}" style="font-size: 0.9em;"></i></p>
          </div>
        </div>`;
      }

      // Mood
      if (today.mood) {
        let moodIcon = 'bi-emoji-smile';
        if (comparison.mood === 'improved') moodIcon = 'bi-hand-thumbs-up';
        else if (comparison.mood === 'declined') moodIcon = 'bi-hand-thumbs-down';
        html += `<div class="health-status-item">
          <i class="bi bi-emoji-smile"></i>
          <div class="health-status-info">
            <p class="label">Mood</p>
            <p class="value">${today.mood}/5 <i class="bi ${moodIcon}" style="font-size: 0.9em;"></i></p>
          </div>
        </div>`;
      }

      // BMI
      if (bmi) {
        let bmiStatus = 'Normal';
        let bmiColor = '#4CAF50';
        if (bmi < 18.5) {
          bmiStatus = 'Underweight';
          bmiColor = '#FF9800';
        } else if (bmi > 25 && bmi < 30) {
          bmiStatus = 'Overweight';
          bmiColor = '#FF9800';
        } else if (bmi >= 30) {
          bmiStatus = 'Obese';
          bmiColor = '#F44336';
        }
        html += `<div class="health-status-item">
          <i class="bi bi-weight" style="color: ${bmiColor};"></i>
          <div class="health-status-info">
            <p class="label">BMI</p>
            <p class="value" style="color: ${bmiColor};">${bmi} (${bmiStatus})</p>
          </div>
        </div>`;
      }

      // Medical Condition Alert
      if (userProfile.medical_conditions) {
        html += `<div class="health-status-item alert-medical">
          <i class="bi bi-exclamation-circle"></i>
          <div class="health-status-info">
            <p class="label">Medical Conditions</p>
            <p class="value">${userProfile.medical_conditions}</p>
            <p style="font-size: 0.85rem; margin-top: 0.25rem; color: #d32f2f;">Remember to follow-up with healthcare provider</p>
          </div>
        </div>`;
      }

      html += '</div>';
      document.getElementById('healthStatusContent').innerHTML = html;
    } else {
      document.getElementById('healthStatusContent').innerHTML = 
        '<p style="color: #999; text-align: center;">No health data recorded for today. Start logging your health metrics!</p>';
    }
  } catch (err) {
    console.error('Error loading health status:', err);
    document.getElementById('healthStatusContent').innerHTML = 
      '<p style="color: #f44336; text-align: center;">Error loading health status</p>';
  }
}

// Load Appointments
async function loadAppointments() {
  try {
    const response = await fetch('/health/appointments');
    const result = await response.json();

    if (result.success && result.appointments.length > 0) {
      let html = '<div class="appointments-list">';
      result.appointments.forEach(apt => {
        const aptDate = new Date(apt.appointment_date);
        const dateStr = aptDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        const timeStr = apt.appointment_time ? apt.appointment_time.substring(0, 5) : 'TBD';
        
        html += `<div class="appointment-item">
          <div class="appointment-date">
            <i class="bi bi-calendar-event"></i>
            <div>
              <p class="date">${dateStr}</p>
              <p class="time">${timeStr}</p>
            </div>
          </div>
          <div class="appointment-details">
            <p class="reason"><strong>${apt.reason}</strong></p>
            ${apt.medical_condition ? `<p class="condition"><i class="bi bi-hospital"></i> ${apt.medical_condition}</p>` : ''}
            ${apt.notes ? `<p class="notes">${apt.notes}</p>` : ''}
          </div>
          <div class="appointment-actions">
            <button class="btn-small" onclick="editAppointment(${apt.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-small delete" onclick="deleteAppointment(${apt.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>`;
      });
      html += '</div>';
      document.getElementById('appointmentsList').innerHTML = html;
    } else {
      document.getElementById('appointmentsList').innerHTML = 
        '<p style="color: #999; text-align: center;">No upcoming appointments scheduled.</p>';
    }
  } catch (err) {
    console.error('Error loading appointments:', err);
    document.getElementById('appointmentsList').innerHTML = 
      '<p style="color: #f44336; text-align: center;">Error loading appointments</p>';
  }
}

// Add Appointment Modal
function showAddAppointmentModal() {
  const html = `
    <div class="modal-overlay" id="appointmentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="bi bi-calendar-plus"></i> Add Appointment</h3>
          <button class="modal-close" onclick="closeModal('appointmentModal')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="appointmentForm">
            <div class="form-group">
              <label>Date *</label>
              <input type="date" id="aptDate" required>
            </div>
            <div class="form-group">
              <label>Time</label>
              <input type="time" id="aptTime">
            </div>
            <div class="form-group">
              <label>Reason *</label>
              <input type="text" id="aptReason" placeholder="e.g., Check-up, Follow-up" required>
            </div>
            <div class="form-group">
              <label>Medical Condition (if applicable)</label>
              <input type="text" id="aptCondition" placeholder="e.g., Diabetes follow-up">
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea id="aptNotes" rows="3" placeholder="Additional notes..."></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="health-btn-primary">Add Appointment</button>
              <button type="button" class="health-btn-ghost" onclick="closeModal('appointmentModal')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      appointment_date: document.getElementById('aptDate').value,
      appointment_time: document.getElementById('aptTime').value,
      reason: document.getElementById('aptReason').value,
      medical_condition: document.getElementById('aptCondition').value,
      notes: document.getElementById('aptNotes').value
    };

    try {
      const response = await fetch('/health/appointments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        closeModal('appointmentModal');
        loadAppointments();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (err) {
      alert('Error adding appointment');
      console.error(err);
    }
  });
}

function editAppointment(id) {
  // Fetch appointment data
  fetch(`/health/appointments/${id}`)
    .then(res => res.json())
    .then(apt => {
      if (apt.success) {
        const appointment = apt.appointment;
        const html = `
          <div class="modal-overlay" id="editAppointmentModal">
            <div class="modal-content">
              <div class="modal-header">
                <h3><i class="bi bi-pencil-square"></i> Edit Appointment</h3>
                <button class="modal-close" onclick="closeModal('editAppointmentModal')">&times;</button>
              </div>
              <div class="modal-body">
                <form id="editAppointmentForm">
                  <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="editAptDate" value="${appointment.appointment_date}" required>
                  </div>
                  <div class="form-group">
                    <label>Time</label>
                    <input type="time" id="editAptTime" value="${appointment.appointment_time || ''}">
                  </div>
                  <div class="form-group">
                    <label>Reason *</label>
                    <input type="text" id="editAptReason" value="${appointment.reason}" required>
                  </div>
                  <div class="form-group">
                    <label>Medical Condition (if applicable)</label>
                    <input type="text" id="editAptCondition" value="${appointment.medical_condition || ''}">
                  </div>
                  <div class="form-group">
                    <label>Notes</label>
                    <textarea id="editAptNotes" rows="3">${appointment.notes || ''}</textarea>
                  </div>
                  <div class="form-actions">
                    <button type="submit" class="health-btn-primary">Update Appointment</button>
                    <button type="button" class="health-btn-ghost" onclick="closeModal('editAppointmentModal')">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('editAppointmentForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = {
            appointment_date: document.getElementById('editAptDate').value,
            appointment_time: document.getElementById('editAptTime').value,
            reason: document.getElementById('editAptReason').value,
            medical_condition: document.getElementById('editAptCondition').value,
            notes: document.getElementById('editAptNotes').value
          };

          try {
            const response = await fetch(`/health/appointments/update/${id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
              closeModal('editAppointmentModal');
              loadAppointments();
            } else {
              alert('Error: ' + result.message);
            }
          } catch (err) {
            alert('Error updating appointment');
            console.error(err);
          }
        });
      }
    })
    .catch(err => {
      alert('Error loading appointment');
      console.error(err);
    });
}

function deleteAppointment(id) {
  if (confirm('Are you sure you want to delete this appointment?')) {
    fetch(`/health/appointments/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          loadAppointments();
        } else {
          alert('Error: ' + result.message);
        }
      })
      .catch(err => {
        alert('Error deleting appointment');
        console.error(err);
      });
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

// Load Charts
async function loadCharts() {
  chartScript.onload = async () => {
    try {
      // Weight & BMI Chart
      const weightResponse = await fetch('/health/charts/weight-bmi');
      const weightData = await weightResponse.json();

      if (weightData.success && weightData.data.length > 0) {
        const ctx1 = document.getElementById('chartWeightBMI');
        if (ctx1) {
          new Chart(ctx1, {
            type: 'line',
            data: {
              labels: weightData.data.map(d => d.date),
              datasets: [
                {
                  label: 'Weight (kg)',
                  data: weightData.data.map(d => d.weight),
                  borderColor: '#D46EF5',
                  backgroundColor: 'rgba(212, 110, 245, 0.1)',
                  tension: 0.3,
                  yAxisID: 'y'
                },
                {
                  label: 'BMI',
                  data: weightData.data.map(d => d.bmi),
                  borderColor: '#667EEA',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  tension: 0.3,
                  yAxisID: 'y1'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              interaction: { mode: 'index', intersect: false },
              scales: {
                y: { type: 'linear', position: 'left', title: { display: true, text: 'Weight (kg)' } },
                y1: { type: 'linear', position: 'right', title: { display: true, text: 'BMI' } }
              }
            }
          });
        }
      }

      // Health Metrics Chart
      const metricsResponse = await fetch('/health/charts/health-metrics');
      const metricsData = await metricsResponse.json();

      if (metricsData.success && metricsData.data.length > 0) {
        const ctx2 = document.getElementById('chartMetrics');
        if (ctx2) {
          new Chart(ctx2, {
            type: 'bar',
            data: {
              labels: metricsData.data.map(d => d.date),
              datasets: [
                {
                  label: 'Sleep (h)',
                  data: metricsData.data.map(d => d.sleep),
                  backgroundColor: '#4A90E2'
                },
                {
                  label: 'Steps (÷100)',
                  data: metricsData.data.map(d => d.steps / 100),
                  backgroundColor: '#50C878'
                },
                {
                  label: 'Water (L)',
                  data: metricsData.data.map(d => d.water),
                  backgroundColor: '#00B4D8'
                },
                {
                  label: 'Mood (score)',
                  data: metricsData.data.map(d => d.mood),
                  backgroundColor: '#FFD700'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              scales: { y: { beginAtZero: true } }
            }
          });
        }
      }
    } catch (err) {
      console.error('Error loading charts:', err);
    }
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadHealthStatusToday();
  loadAppointments();
  loadCharts();

  document.getElementById('btnAddAppointment')?.addEventListener('click', showAddAppointmentModal);
});
