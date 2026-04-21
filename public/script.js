const API = "http://localhost:3000/api";

// 🔥 MESSAGE FUNCTION
function showMessage(text, type = "success") {
    const msg = document.getElementById("message");

    msg.innerText = text;
    msg.style.display = "block";

    if (type === "success") {
        // msg.style.background = "#d4edda";
        msg.style.color = "#72ff93";
    } else {
        // msg.style.background = "#f8d7da";
        msg.style.color = "#ff8e99";
    }
}

// 🔥 SHOW OTP SECTION
function showOTPSection() {
    const regForm = document.getElementById('registration-form');
    const otpSection = document.getElementById('otp-section');
    const statusText = document.getElementById('status-text');

    regForm.style.display = 'none';
    otpSection.style.display = 'block';

    statusText.innerText = "Verification Required";
    statusText.style.color = "#a78bfa";
}

//REGISTER 
async function register() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();

    //VALIDATION
    if (!username || !email || !phone || !password) {
        showMessage("Please fill all fields", "error");
        return;
    }

    //EMAIL VALIDATION
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showMessage("Enter a valid email ❗", "error");
        return;
    }

    // PHONE VALIDATION (10 digits)
    if (!/^\d{10}$/.test(phone)) {
        showMessage("Enter valid 10-digit phone number ❗", "error");
        return;
    }

    //PASSWORD LENGTH
    if (password.length < 6) {
        showMessage("Password must be at least 6 characters ❗", "error");
        return;
    }

    // API CALL ONLY IF VALID
    const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password })
    });

    const text = await res.text();

    if (text.toLowerCase().includes("otp")) {
        showMessage("OTP sent to your email ", "success");

        
        localStorage.setItem("tempEmail", email);

        showOTPSection();
    } else {
        showMessage(text, "error");
    }
}

// ================= VERIFY OTP =================
async function verifyOTP() {
    const email = localStorage.getItem("tempEmail");
    const emailOTP = document.getElementById("emailOTP").value.trim();

    console.log("Email:", email);
    console.log("OTP:", emailOTP);

    if (!email) {
        showMessage("Session expired. Register again ❗", "error");
        return;
    }

    if (!emailOTP) {
        showMessage("Enter OTP ❗", "error");
        return;
    }

    const res = await fetch(`${API}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, emailOTP })
    });

    const text = await res.text();

    console.log("VERIFY RESPONSE:", text);

    if (text.toLowerCase().includes("success")) {
        showMessage("Registration successful ", "success");

        localStorage.setItem("user", email);
        localStorage.removeItem("tempEmail");

        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);
    } else {
        showMessage(text, "error");
    }
}

// ================= LOGIN =================
async function login() {
    const data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
        showMessage("Login successful", "success");

        localStorage.setItem("user", data.email);

        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);
    } else {
        showMessage(result.message, "error");
    }
}