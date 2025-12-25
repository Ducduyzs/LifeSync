import express from "express";
const router = express.Router();

// 🌸 Trang chủ – Kiểm tra login
router.get("/", (req, res) => {
  // Nếu có session → vào dashboard
  if (req.session && req.session.user_id) {
    return res.redirect("/dashboard");
  }

  // Nếu chưa đăng nhập → về trang login
  return res.redirect("/auth/login");
});

export default router;
