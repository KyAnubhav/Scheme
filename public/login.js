const token = localStorage.getItem("token");

if (token) {
  const role = localStorage.getItem("role");
  window.location.href = role === "admin" ? "admin.html" : "dashboard.html";
}

function setMsg(text, good = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.className = good ? "notice good" : "small";
  el.textContent = text || "";
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setMsg("Enter email and password.");
    return;
  }

  setMsg("Signing in...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      setMsg(data.message || "Login failed.");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);

    setMsg("Login successful.", true);
    window.location.href = data.user.role === "admin" ? "admin.html" : "dashboard.html";
  } catch (err) {
    setMsg(err.message || "Login failed.");
  }
}
