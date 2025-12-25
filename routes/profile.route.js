import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import db from "../configs/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("profile/account", {
    pageTitle: "Account Profile - LifeSync",
  });
});

router.post("/update", async (req, res) => {
  const { full_name, email } = req.body;
  const userId = req.session.user_id;

  const current = await db.query(
    "SELECT email FROM users WHERE user_id = $1",
    [userId]
  );

  const oldEmail = current[0].email;

  if (email && email !== oldEmail) {
    const otp = crypto.randomInt(100000, 999999).toString();

    await db.query(
      `
      UPDATE users
      SET full_name = $1,
          email = $2,
          otp_code = $3,
          otp_created_at = NOW()
      WHERE user_id = $4
      `,
      [full_name, email, otp, userId]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LifeSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your new email",
      text: `Your verification code is ${otp}`,
    });

    return res.render("auth/verify", {
      pageTitle: "Verify Email - LifeSync",
      email,
      next: "profile",
      toastMessage: "please verify your new email",
      toastType: "info",
    });
  }

  await db.query(
    "UPDATE users SET full_name = $1 WHERE user_id = $2",
    [full_name, userId]
  );

  req.session.full_name = full_name;

  res.redirect("/profile");
});

export default router;
