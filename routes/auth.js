const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { sql, poolPromise } = require("../db");
const { sendEmailOTP } = require("../utils/mailer");
const otpStore = require("../utils/otpStore");
require("dotenv").config();

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = await poolPromise;

    const existing = await db.request()
      .input("email", sql.NVarChar(150), email)
      .input("phone", sql.NVarChar(20), phone)
      .query("SELECT id FROM Users WHERE email = @email OR phone = @phone");

    if (existing.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Email or phone already registered" });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false
    });

    otpStore[email] = {
      otp,
      userData: { username, email, phone, password },
      createdAt: Date.now()
    };

    await sendEmailOTP(email, otp);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, emailOTP } = req.body;
    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (Date.now() - record.createdAt > 10 * 60 * 1000) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (String(record.otp) !== String(emailOTP)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const { username, phone, password } = record.userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await poolPromise;

    await db.request()
      .input("username", sql.NVarChar(100), username)
      .input("email", sql.NVarChar(150), email)
      .input("phone", sql.NVarChar(20), phone)
      .input("password_hash", sql.NVarChar(255), hashedPassword)
      .query(`
        INSERT INTO Users (username, email, phone, password_hash, role, is_verified, email_verified_at)
        VALUES (@username, @email, @phone, @password_hash, 'user', 1, SYSDATETIME())
      `);

    delete otpStore[email];
    return res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await poolPromise;

    const result = await db.request()
      .input("email", sql.NVarChar(150), email)
      .query("SELECT id, username, email, password_hash, role, is_verified FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = result.recordset[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
