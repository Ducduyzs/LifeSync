document.addEventListener("DOMContentLoaded", () => {
  const btnSaveLog = document.getElementById("btnSaveLog");
  function clearFieldErrors(scope = document) {
    const errs = scope.querySelectorAll('.field-error');
    errs.forEach(e => e.remove());
    const invalids = scope.querySelectorAll('.invalid');
    invalids.forEach(i => i.classList.remove('invalid'));
  }

  function showFieldError(inputEl, msg) {
    if (!inputEl) return;
    inputEl.classList.add('invalid');
    const err = document.createElement('div');
    err.className = 'field-error';
    err.textContent = msg;
    if (inputEl.nextSibling) inputEl.parentNode.insertBefore(err, inputEl.nextSibling);
    else inputEl.parentNode.appendChild(err);
  }

  function validateHealthForm() {
    const errors = [];
    const get = (id) => document.getElementById(id);
    const date = get('healthDate') ? get('healthDate').value.trim() : '';
    const sleep = get('sleepHours') ? get('sleepHours').value.trim() : '';
    const steps = get('steps') ? get('steps').value.trim() : '';
    const calories = get('calories') ? get('calories').value.trim() : '';
    const water = get('water') ? get('water').value.trim() : '';
    const mood = get('mood') ? get('mood').value.trim() : '';
    const height = get('heightCm') ? get('heightCm').value.trim() : '';
    const weight = get('weightKg') ? get('weightKg').value.trim() : '';

    if (date && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
      errors.push({ field: 'healthDate', message: 'Date phải ở định dạng YYYY-MM-DD' });
    }

    if (sleep !== '' && (isNaN(sleep) || Number(sleep) < 0 || Number(sleep) > 24)) {
      errors.push({ field: 'sleepHours', message: 'Sleep hours phải là số trong khoảng 0-24' });
    }

    if (steps !== '' && (!Number.isInteger(Number(steps)) || Number(steps) < 0)) {
      errors.push({ field: 'steps', message: 'Steps phải là số nguyên >= 0' });
    }

    if (calories !== '' && (!Number.isInteger(Number(calories)) || Number(calories) < 0)) {
      errors.push({ field: 'calories', message: 'Calories phải là số nguyên >= 0' });
    }

    if (water !== '' && (isNaN(water) || Number(water) < 0)) {
      errors.push({ field: 'water', message: 'Water intake phải là số >= 0' });
    }

    if (mood !== '' && (!Number.isInteger(Number(mood)) || Number(mood) < 0 || Number(mood) > 5)) {
      errors.push({ field: 'mood', message: 'Mood phải là số nguyên từ 0 đến 5' });
    }

    if (height !== '' && (isNaN(height) || Number(height) <= 0)) {
      errors.push({ field: 'heightCm', message: 'Height phải là số dương (cm)' });
    }

    if (weight !== '' && (isNaN(weight) || Number(weight) <= 0)) {
      errors.push({ field: 'weightKg', message: 'Weight phải là số dương (kg)' });
    }

    return errors;
  }

  if (btnSaveLog) {
    btnSaveLog.onclick = async () => {
      clearFieldErrors();
      const errors = validateHealthForm();
      if (errors.length) {
        errors.forEach(e => {
          const el = document.getElementById(e.field);
          showFieldError(el, e.message);
        });
        showToast('Error saving health log.', 'error');
        return;
      }

      const body = {
        date: document.getElementById('healthDate').value || null,
        sleep_hours: document.getElementById('sleepHours').value === '' ? null : Number(document.getElementById('sleepHours').value),
        steps: document.getElementById('steps').value === '' ? null : Number(document.getElementById('steps').value),
        calories: document.getElementById('calories').value === '' ? null : Number(document.getElementById('calories').value),
        water_intake: document.getElementById('water').value === '' ? null : Number(document.getElementById('water').value),
        mood: document.getElementById('mood').value === '' ? null : Number(document.getElementById('mood').value),
        height_cm: document.getElementById('heightCm') && document.getElementById('heightCm').value !== '' ? Number(document.getElementById('heightCm').value) : null,
        weight_kg: document.getElementById('weightKg') && document.getElementById('weightKg').value !== '' ? Number(document.getElementById('weightKg').value) : null,
        medical_conditions: document.getElementById('medicalConditions') ? document.getElementById('medicalConditions').value : null,
      };

      try {
        btnSaveLog.disabled = true;
        const res = await fetch('/health/save-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const j = await res.json();

        if (res.ok && j.success) {
          showToast(j.message || 'Health log saved.', 'success');
          if (typeof loadHealthStatusToday === 'function') loadHealthStatusToday();
        } else {
          if (j.errors && Array.isArray(j.errors)) {
            j.errors.forEach(err => {
              const map = {
                sleep_hours: 'sleepHours',
                steps: 'steps',
                calories: 'calories',
                water_intake: 'water',
                mood: 'mood',
                height_cm: 'heightCm',
                weight_kg: 'weightKg',
                date: 'healthDate'
              };
              const id = map[err.field] || err.field;
              const el = document.getElementById(id);
              showFieldError(el, err.message || 'Invalid value');
            });
          }

          showToast(j.message || 'Error saving health log.', 'error');
        }
      } catch (err) {
        console.error('Error saving health log:', err);
        showToast('Network error. Please try again.', 'error');
      } finally {
        btnSaveLog.disabled = false;
      }
    };
  }

  const btnCalorie = document.getElementById("btnCalorie");
  if (btnCalorie) {
    btnCalorie.onclick = async () => {
      const input = document.getElementById("foodInput");
      const output = document.getElementById("calorieResult");
      const text = input.value.trim();
      if (!text) return;
      output.innerHTML = "Đang tính...";

      const res = await fetch("/health/ai/calories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      output.innerHTML = j.answer;
    };
  }
  const btnMeal = document.getElementById("btnMeal");
  if (btnMeal) {
    btnMeal.onclick = async () => {
      const goal = document.getElementById("mealGoal").value;
      const condition = document.getElementById("mealCondition").value.trim();
      const output = document.getElementById("mealResult");
      output.innerHTML = "Đang phân tích...";

      const res = await fetch("/health/ai/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, condition }),
      });
      const j = await res.json();
      output.innerHTML = j.answer;
    };
  }

  const btnSymptom = document.getElementById("btnSymptom");
  if (btnSymptom) {
    btnSymptom.onclick = async () => {
      const text = document
        .getElementById("symptomInput")
        .value.trim();
      const output = document.getElementById("symptomResult");
      if (!text) return;
      output.innerHTML = "Đang phân tích...";

      const res = await fetch("/health/ai/symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      output.innerHTML = j.answer;
    };
  }

  const btnWeeklyAdvice = document.getElementById("btnWeeklyAdvice");
  if (btnWeeklyAdvice) {
    btnWeeklyAdvice.onclick = async () => {
      const output = document.getElementById("weeklyAdvice");
      output.innerHTML = "Đang phân tích dữ liệu 7 ngày...";
      const res = await fetch("/health/weekly-advice");
      const j = await res.json();
      output.innerHTML = j.answer;
    };
  }
});
