function setMsg(text, good = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.className = good ? "notice good" : "small";
  el.textContent = text || "";
}

async function register() {
  const payload = {
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value
  };

  if (!payload.username || !payload.email || !payload.phone || !payload.password) {
    setMsg("Fill all fields.");
    return;
  }

  setMsg("Sending OTP...");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message || "Could not send OTP.");
      return;
    }

    setMsg(data.message || "OTP sent to email.", true);
  } catch (err) {
    setMsg(err.message || "Could not send OTP.");
  }
}

async function verifyOtp() {
  const email = document.getElementById("email").value.trim();
  const emailOTP = document.getElementById("otp").value.trim();

  if (!email || !emailOTP) {
    setMsg("Enter email and OTP.");
    return;
  }

  setMsg("Verifying OTP...");

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, emailOTP })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message || "OTP verification failed.");
      return;
    }

    setMsg(data.message || "Account created.", true);
    setTimeout(() => window.location.href = "login.html", 800);
  } catch (err) {
    setMsg(err.message || "OTP verification failed.");
  }
}
