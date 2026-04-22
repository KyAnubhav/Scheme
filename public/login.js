const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (token && role) {
  window.location.href = role === "admin" ? "/admin.html" : "/dashboard.html";
}

function setBusy(busy) {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.disabled = busy;
}

async function login() {
  const msg = document.getElementById("msg");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    msg.textContent = "Enter email and password.";
    return;
  }

  msg.textContent = "Signing in...";
  setBusy(true);

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.message || "Login failed.";
      setBusy(false);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("email", data.user.email);

    window.location.href = data.user.role === "admin" ? "/admin.html" : "/dashboard.html";
  } catch (err) {
    msg.textContent = err.message;
    setBusy(false);
  }
}
