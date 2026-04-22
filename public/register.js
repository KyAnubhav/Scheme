let otpSent = false;

function setBusy(buttonId, busy, text) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.disabled = busy;
  if (text) btn.textContent = text;
}

async function sendOtp() {
  const msg = document.getElementById("msg");
  const payload = {
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value
  };

  if (!payload.username || !payload.email || !payload.phone || !payload.password) {
    msg.textContent = "Fill all fields.";
    return;
  }

  msg.textContent = "Sending OTP...";
  setBusy("otpBtn", true);

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    msg.textContent = data.message || "OTP sent.";
    if (data.success) {
      otpSent = true;
      document.getElementById("otpArea").classList.remove("hide");
    }
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    setBusy("otpBtn", false, "Send OTP");
  }
}

async function verifyOtp() {
  const msg = document.getElementById("msg");
  if (!otpSent) {
    msg.textContent = "Send OTP first.";
    return;
  }

  const email = document.getElementById("email").value.trim();
  const emailOTP = document.getElementById("otp").value.trim();

  if (!emailOTP) {
    msg.textContent = "Enter the OTP.";
    return;
  }

  msg.textContent = "Verifying...";
  setBusy("verifyBtn", true);

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, emailOTP })
    });
    const data = await res.json();

    msg.textContent = data.message || "Done.";
    if (data.success) {
      setTimeout(() => window.location.href = "/login.html", 900);
    }
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    setBusy("verifyBtn", false, "Verify & Create Account");
  }
}
