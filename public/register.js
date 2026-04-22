let otpSent = false;

async function sendOtp() {
  const msg = document.getElementById("msg");
  msg.textContent = "Sending OTP...";

  const payload = {
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value
  };

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    msg.textContent = data.message || "OTP sent";

    if (data.success) {
      otpSent = true;
      document.getElementById("otpArea").classList.remove("hide");
    }
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function verifyOtp() {
  const msg = document.getElementById("msg");
  msg.textContent = "Verifying...";

  if (!otpSent) {
    msg.textContent = "Please send OTP first";
    return;
  }

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value.trim(),
        emailOTP: document.getElementById("otp").value.trim()
      })
    });

    const data = await res.json();
    msg.textContent = data.message || "Done";

    if (data.success) {
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1000);
    }
  } catch (err) {
    msg.textContent = err.message;
  }
}
