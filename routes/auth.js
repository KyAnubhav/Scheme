const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");

const { pool } = require("../db");
const sendEmailOTP = require("../utils/mailer");
const sendSMS = require("../utils/sms");
const otpStore = require("../utils/otpStore");

// REGISTER - SEND OTP
router.post("/register", async (req, res) => {
    const { username, email, phone, password } = req.body;

    const emailOTP = otpGenerator.generate(6, { digits: true });

    otpStore[email] = {
        emailOTP,
        userData: { username, email, phone, password }
    };

    await sendEmailOTP(email, emailOTP);
    

    res.send("OTP sent to email");
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
    const { email, emailOTP } = req.body;

    const record = otpStore[email];
    if (!record) return res.send("OTP not found");

    if (record.emailOTP === emailOTP) {
        const { username, phone, password } = record.userData;

        const hashedPassword = await bcrypt.hash(password, 10);

        const db = await pool;
        await db.request()
            .input("username", username)
            .input("email", email)
            .input("phone", phone)
            .input("password", hashedPassword)
            .query(`
                INSERT INTO Users (username, email, phone, password)
                VALUES (@username, @email, @phone, @password)
            `);

        delete otpStore[email];

        res.send("User registered successfully");
    } else {
        res.send("Invalid OTP");
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const db = await pool;

    const result = await db.request()
        .input("email", email)
        .query("SELECT * FROM Users WHERE email = @email");

    if (result.recordset.length === 0)
        return res.send("User not found");

    const user = result.recordset[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.send("Wrong password");

    res.json({ success: true, message: "Login successful" });
});

module.exports = router;