//Validate server cho health form — date, sleep 0-24, steps/calories >=0, water >=0, mood 1-5, height/weight >0
export function validateSaveLog(req, res, next) {
  const errors = [];
  const body = req.body || {};

  if (body.date) {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.date)) {
      errors.push({ field: 'date', message: 'Date phải ở định dạng YYYY-MM-DD' });
    }
  }

  const parseNum = (v) => (v === null || v === undefined || v === '') ? null : Number(v);

  const sleep = parseNum(body.sleep_hours);
  if (sleep !== null && (isNaN(sleep) || sleep < 0 || sleep > 24)) {
    errors.push({ field: 'sleep_hours', message: 'Sleep hours phải là số trong khoảng 0-24' });
  }

  const steps = parseNum(body.steps);
  if (steps !== null && (!Number.isInteger(steps) || steps < 0)) {
    errors.push({ field: 'steps', message: 'Steps phải là số nguyên >= 0' });
  }

  const calories = parseNum(body.calories);
  if (calories !== null && (!Number.isInteger(calories) || calories < 0)) {
    errors.push({ field: 'calories', message: 'Calories phải là số nguyên >= 0' });
  }

  const water = parseNum(body.water_intake);
  if (water !== null && (isNaN(water) || water < 0)) {
    errors.push({ field: 'water_intake', message: 'Water intake phải là số >= 0 (đơn vị L)' });
  }

  const mood = parseNum(body.mood);
  if (mood !== null && (!Number.isInteger(mood) || mood < 1 || mood > 5)) {
    errors.push({ field: 'mood', message: 'Mood phải là số nguyên từ 1 đến 5' });
  }

  const height = parseNum(body.height_cm);
  if (height !== null && (isNaN(height) || height <= 0)) {
    errors.push({ field: 'height_cm', message: 'Height phải là số dương (cm)' });
  }

  const weight = parseNum(body.weight_kg);
  if (weight !== null && (isNaN(weight) || weight <= 0)) {
    errors.push({ field: 'weight_kg', message: 'Weight phải là số dương (kg)' });
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  req.body.sleep_hours = sleep !== null ? Number(sleep) : null;
  req.body.steps = steps !== null ? Number(steps) : null;
  req.body.calories = calories !== null ? Number(calories) : null;
  req.body.water_intake = water !== null ? Number(water) : null;
  req.body.mood = mood !== null ? Number(mood) : null;
  req.body.height_cm = height !== null ? Number(height) : null;
  req.body.weight_kg = weight !== null ? Number(weight) : null;

  next();
}

export function validateAppointment(req, res, next) {
  const errors = [];
  const body = req.body || {};

  if (!body.appointment_date) {
    errors.push({ field: 'appointment_date', message: 'Appointment date is required' });
  } else if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.appointment_date)) {
    errors.push({ field: 'appointment_date', message: 'Date phải ở định dạng YYYY-MM-DD' });
  }

  if (body.appointment_time && !/^[0-9]{2}:[0-9]{2}$/.test(body.appointment_time)) {
    errors.push({ field: 'appointment_time', message: 'Time phải ở định dạng HH:MM' });
  }

  if (!body.reason || String(body.reason).trim().length === 0) {
    errors.push({ field: 'reason', message: 'Reason là bắt buộc' });
  } else if (String(body.reason).length > 500) {
    errors.push({ field: 'reason', message: 'Reason quá dài (tối đa 500 ký tự)' });
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  req.body.reason = String(body.reason).trim();
  if (body.medical_condition) req.body.medical_condition = String(body.medical_condition).trim();
  if (body.notes) req.body.notes = String(body.notes).trim();

  next();
}
