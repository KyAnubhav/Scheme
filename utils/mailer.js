require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendEmailOTP(email, otp) {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "OTP Verification - Government Scheme Portal",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Government Scheme Portal</h2>
        <p>Your OTP is:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${otp}</div>
        <p>This OTP is valid for 10 minutes.</p>
      </div>
    `,
  });
}

async function sendSchemeAlert(email, username, scheme) {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: `New eligible scheme: ${scheme.scheme_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${username || "User"},</h2>
        <p>You appear eligible for a new government scheme:</p>
        <h3>${scheme.scheme_name}</h3>
        <p>${scheme.short_title || ""}</p>
        <p><strong>Category:</strong> ${scheme.category_name || "-"}</p>
        <p><strong>Ministry:</strong> ${scheme.ministry_name || "-"}</p>
        <p>${scheme.description || ""}</p>
        <p><a href="${scheme.application_link || scheme.official_website || "#"}" target="_blank">Open scheme details</a></p>
      </div>
    `,
  });
}

module.exports = { sendEmailOTP, sendSchemeAlert };
