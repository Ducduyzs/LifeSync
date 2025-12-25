import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "../configs/db.js";

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("auth/login", { pageTitle: "Login - LifeSync", user: null });
});

router.get("/register", (req, res) => {
  res.render("auth/register", { pageTitle: "Register - LifeSync", user: null });
});

router.post("/register", async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    const existing = await db.query("SELECT * FROM users WHERE email=$1", [email]);

    if (existing.length > 0 && !existing[0].otp_code) {
      return res.render("auth/register", {
        pageTitle: "Register - LifeSync",
        toastMessage: "Email already registered. Please log in instead.",
        toastType: "warning",
        user: null
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashed = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      await db.query(
        'UPDATE users SET otp_code=$1, otp_created_at=NOW() WHERE email=$2',
        [otp, email]
      );
    } else {
      await db.query(
        'INSERT INTO users (full_name, email, password_hash, otp_code, otp_created_at) VALUES ($1,$2,$3,$4,NOW())',
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
      text: `Your verification code is ${otp}`,
    });

    res.render("auth/verify", {
      pageTitle: "Verify Email - LifeSync",
      email,
      toastMessage: "OTP has been sent to your email.",
      toastType: "info",
      user: null
    });
  } catch (err) {
    console.error(err);
    res.render("auth/register", {
      pageTitle: "Register - LifeSync",
      toastMessage: "Failed to send OTP.",
      toastType: "error",
      user: null
    });
  }
});

router.post("/verify", async (req, res) => {
  const { email, otp, next } = req.body;
  try {
    const user = await db.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
        AND otp_code = $2
        AND (NOW() AT TIME ZONE 'UTC') - otp_created_at <= INTERVAL '3 minutes'
      `,
      [email, otp]
    );

    if (user.length === 0) {
      return res.render("auth/verify", {
        pageTitle: "Verify Email - LifeSync",
        email,
        next,
        toastMessage: "otp expired or invalid",
        toastType: "error",
        user: null
      });
    }

    await db.query(
      "UPDATE users SET otp_code = NULL, otp_created_at = NULL WHERE email = $1",
      [email]
    );

    if (next === "profile") {
      return res.redirect("/profile");
    }

    return res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    res.render("auth/verify", {
      pageTitle: "Verify Email - LifeSync",
      email,
      next,
      toastMessage: "verification failed",
      toastType: "error",
      user: null
    });
  }
});



router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.length === 0) {
      return res.render("auth/login", {
        pageTitle: "Login - LifeSync",
        toastMessage: "Invalid email or password.",
        toastType: "error",
        user: null
      });
    }

    const ok = await bcrypt.compare(password, user[0].password_hash);
    if (!ok) {
      return res.render("auth/login", {
        pageTitle: "Login - LifeSync",
        toastMessage: "Invalid email or password.",
        toastType: "error",
        user: null
      });
    }

    req.session.user_id = user[0].user_id;
    req.session.full_name = user[0].full_name;

    req.session.save(() => res.redirect("/dashboard"));
  } catch (err) {
    console.error(err);
    res.render("auth/login", {
      pageTitle: "Login - LifeSync",
      toastMessage: "Login failed.",
      toastType: "error",
      user: null
    });
  }
});


router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.length === 0) {
      return res.json({ message: "email not found", type: "error" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await db.query(
      "UPDATE users SET otp_code = $1, otp_created_at = NOW() WHERE email = $2",
      [otp, email]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"LifeSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Resend OTP - LifeSync",
      text: `Your new OTP code is: ${otp}`,
    });

    res.json({ message: "otp resent successfully", type: "success" });
  } catch (err) {
    console.error(err);
    res.json({ message: "failed to resend otp", type: "error" });
  }
});

export default router;
