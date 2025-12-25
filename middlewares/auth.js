export function requireLogin(req, res, next) {
  if (!req.session.user_id) {
    return res.redirect("/auth/login");
  }
  next();
}
