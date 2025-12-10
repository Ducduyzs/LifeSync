document.addEventListener("DOMContentLoaded", () => {
  const btnSaveLog = document.getElementById("btnSaveLog");
  if (btnSaveLog) {
    btnSaveLog.onclick = async () => {
      const body = {
        date: document.getElementById("healthDate").value,
        sleep_hours: document.getElementById("sleepHours").value,
        steps: document.getElementById("steps").value,
        calories: document.getElementById("calories").value,
        water_intake: document.getElementById("water").value,
        mood: document.getElementById("mood").value,
        height_cm: document.getElementById("heightCm") ? document.getElementById("heightCm").value : null,
        weight_kg: document.getElementById("weightKg") ? document.getElementById("weightKg").value : null,
        medical_conditions: document.getElementById("medicalConditions") ? document.getElementById("medicalConditions").value : null,
      };

      const res = await fetch("/health/save-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await res.json();
      alert(j.message || "Done");
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
