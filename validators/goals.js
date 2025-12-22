export function validateGoalPayload(req, res, next) {
  const { goal_type, target, period } = req.body;
  const errors = [];
  const allowed = ['steps', 'sleep', 'water', 'calories'];
  if (!goal_type || !allowed.includes(goal_type)) errors.push({ field: 'goal_type', message: 'goal_type must be one of: ' + allowed.join(', ') });
  const t = Number(target);
  if (isNaN(t) || t <= 0) errors.push({ field: 'target', message: 'target must be a positive number' });
  if (!period || (period !== 'daily' && period !== 'weekly')) errors.push({ field: 'period', message: "period must be 'daily' or 'weekly'" });
  if (errors.length) return res.status(400).json({ success: false, errors });
  req.body.target = t;
  next();
}