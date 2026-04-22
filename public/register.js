function setMsg(text, kind = "") {
  const box = document.getElementById("msg");
  box.style.display = "block";
  box.className = `notice ${kind}`.trim();
  box.textContent = text;
}

async function register() {
  const payload = {
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value
  };

  if (!payload.username || !payload.email || !payload.phone || !payload.password) {
    setMsg("Fill all fields.", "warn");
    return;
  }

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) {
      setMsg(data.message || "Could not send OTP.", "error");
      return;
    }
    setMsg("OTP sent. Check your email.", "ok");
  } catch (err) {
    setMsg(err.message || "Network error.", "error");
  }
}

async function verifyOtp() {
  const email = document.getElementById("email").value.trim();
  const emailOTP = document.getElementById("otp").value.trim();

  if (!email || !emailOTP) {
    setMsg("Enter email and OTP.", "warn");
    return;
  }

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, emailOTP })
    });
    const data = await res.json();
    if (!data.success) {
      setMsg(data.message || "OTP verification failed.", "error");
      return;
    }
    setMsg("Account created. Please login.", "ok");
    setTimeout(() => { window.location.href = "/login.html"; }, 900);
  } catch (err) {
    setMsg(err.message || "Network error.", "error");
  }
}
