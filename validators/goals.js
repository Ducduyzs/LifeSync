export function validateGoalPayload(req, res, next) {
  const { goal_type, target, period, start_date, end_date, require_each_day } = req.body;
  const errors = [];
  const allowed = ['steps', 'sleep', 'water', 'calories'];
  if (!goal_type || !allowed.includes(goal_type)) errors.push({ field: 'goal_type', message: 'goal_type must be one of: ' + allowed.join(', ') });
  const t = Number(target);
  if (isNaN(t) || t <= 0) errors.push({ field: 'target', message: 'target must be a positive number' });
  if (!period || (period !== 'daily' && period !== 'weekly')) errors.push({ field: 'period', message: "period must be 'daily' or 'weekly'" });

  if ((start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) || (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date))) {
    errors.push({ field: 'date_range', message: 'start_date and end_date must be YYYY-MM-DD if provided' });
  }
  if (start_date && end_date) {
    const s = new Date(start_date);
    const e = new Date(end_date);
    if (e < s) errors.push({ field: 'date_range', message: 'end_date must be same or after start_date' });
  }

  if (require_each_day !== undefined && typeof require_each_day !== 'boolean' && !(require_each_day === 'true' || require_each_day === 'false')) {
    errors.push({ field: 'require_each_day', message: 'require_each_day must be boolean' });
  }

  if (errors.length) return res.status(400).json({ success: false, errors });
  req.body.target = t;
  if (require_each_day === 'true') req.body.require_each_day = true;
  if (require_each_day === 'false') req.body.require_each_day = false;
  next();
}