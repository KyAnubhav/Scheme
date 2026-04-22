function setMessage(text, kind = "") {
  const el = document.getElementById("message");
  el.textContent = text || "";
  el.style.color = kind === "error" ? "#b91c1c" : "#0f172a";
}

async function sendOtp() {
  const payload = {
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value
  };

  if (!payload.username || !payload.email || !payload.phone || !payload.password) {
    setMessage("Fill all fields first.", "error");
    return;
  }

  setMessage("Sending OTP...");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success && data.message) {
      setMessage(data.message, "error");
      return;
    }

    setMessage("OTP sent to your email.");
  } catch (err) {
    setMessage(err.message, "error");
  }
}

async function verifyOtp() {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();

  if (!email || !otp) {
    setMessage("Enter email and OTP.", "error");
    return;
  }

  setMessage("Verifying OTP...");

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, emailOTP: otp })
    });

    const data = await res.json();

    if (!data.success) {
      setMessage(data.message || "OTP verification failed.", "error");
      return;
    }

    setMessage("Account created. You can log in now.");
    window.location.href = "/login.html";
  } catch (err) {
    setMessage(err.message, "error");
  }
}
