const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    host:'smtp.gmail.com',
    port:587,

    auth: {
        user: "manmitpoojary@gmail.com",
        pass: "oomakdcwjeeotjyv"
    }
});

//otp function
async function sendEmailOTP(email, otp) {
    await transporter.sendMail({
        to: email,
        subject: "OTP Verification - Government Scheme Portal",
        html: `
        <div style="background: linear-gradient(135deg, #020024 0%, #090979 35%, #7e22ce 100%); padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center; color: white;">
            <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 30px; max-width: 400px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <h2 style="margin-bottom: 10px; font-size: 24px;">Government Scheme &<br>Student Welfare</h2>
                
                <p style="color: #ccc; font-size: 16px; margin-bottom: 25px;">Account Verification</p>
                
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                    <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #a78bfa; margin-bottom: 10px;">Your OTP Code</span>
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${otp}</span>
                </div>
                
                <p style="font-size: 13px; color: #aaa; line-height: 1.5;">
                    This code is valid for 10 minutes. If you did not request this, please ignore this email.
                </p>
                
                <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 25px 0;">
                
                <p style="font-size: 11px; color: #888;">
                    © 2026 Government Student Welfare Portal. All rights reserved.
                </p>
            </div>
        </div>
        `
    });
}

module.exports = sendEmailOTP;