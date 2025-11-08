import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "../configs/db.js";

const router = express.Router();

// 🩷 Hiển thị form đăng nhập
router.get("/login", (req, res) => {
  res.render("auth/login", { pageTitle: "Login - LifeSync" });
});

// 🩷 Hiển thị form đăng ký
router.get("/register", (req, res) => {
  res.render("auth/register", {pageTitle: "Register - LifeSync" });
});

// 🧩 Xử lý đăng ký (gửi OTP)
router.post("/register", async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    const existing = await db.query("SELECT * FROM users WHERE email=$1", [email]);

    if (existing.length > 0 && !existing[0].otp_code) {
      return res.render("auth/register", {
        layout: false,
        pageTitle: "Register - LifeSync",
        error: "Email already registered. Please log in instead.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashed = await bcrypt.hash(password, 10);

    if (existing.length > 0 && existing[0].otp_code) {
      await db.query(
        'UPDATE users SET "otp_code"=$1, "otp_created_at"=NOW() WHERE email=$2',
        [otp, email]
      );
    } else {
      await db.query(
        'INSERT INTO users (full_name, email, password_hash, "otp_code", "otp_created_at") VALUES ($1, $2, $3, $4, NOW())',
        [full_name, email, hashed, otp]
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"LifeSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your LifeSync account",
      text: `Hello ${full_name},\n\nYour LifeSync verification code is: ${otp}\n\nThis code will expire in 3 minutes.`,
    });

    res.render("auth/verify", {
      layout: false,
      pageTitle: "Verify Email - LifeSync",
      email,
      message: "OTP has been sent to your email.",
    });
  } catch (error) {
    console.error(error);
    res.render("auth/register", {
      layout: false,
      pageTitle: "Register - LifeSync",
      error: "Failed to send OTP. Please try again later.",
    });
  }
});

// 🧠 Xử lý xác minh OTP
router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await db.query(
      'SELECT *, (otp_created_at AT TIME ZONE \'UTC\') AS otp_time_utc FROM users WHERE email=$1 AND "otp_code"=$2',
      [email, otp]
    );

    if (user.length === 0) {
      return res.render("auth/verify", {
        layout: false,
        email,
        error: "Invalid OTP or email.",
      });
    }

    const otpCreatedAt = new Date(user[0].otp_time_utc);
    const expired = Date.now() - otpCreatedAt.getTime() > 3 * 60 * 1000;

    if (expired) {
      await db.query('UPDATE users SET "otp_code"=NULL, "otp_created_at"=NULL WHERE email=$1', [email]);
      return res.render("auth/verify", {
        layout: false,
        email,
        error: "OTP expired. Please register again.",
      });
    }

    await db.query('UPDATE users SET "otp_code"=NULL, "otp_created_at"=NULL WHERE email=$1', [email]);
    res.render("auth/login", {
      layout: false,
      pageTitle: "Login - LifeSync",
      success: "Account verified successfully. You can now log in!",
    });
  } catch (error) {
    console.error(error);
    res.render("auth/verify", {
      layout: false,
      email,
      error: "Verification failed. Please try again.",
    });
  }
});

// 🔐 Xử lý đăng nhập
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.length === 0) {
      return res.render("auth/login", {
        layout: false,
        pageTitle: "Login - LifeSync",
        error: "Invalid email or password.",
      });
    }

    const match = await bcrypt.compare(password, user[0].password_hash);
    if (!match) {
      return res.render("auth/login", {
        layout: false,
        pageTitle: "Login - LifeSync",
        error: "Invalid email or password.",
      });
    }

    // ✅ Lưu session
    req.session.user_id = user[0].user_id;
    req.session.full_name = user[0].full_name;

    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect("/dashboard");
    });
  } catch (error) {
    console.error(error);
    res.render("auth/login", {
      layout: false,
      pageTitle: "Login - LifeSync",
      error: "Login failed. Please try again.",
    });
  }
});

export default router;
