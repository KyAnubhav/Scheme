const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (token && role) {
  window.location.href = role === "admin" ? "/admin.html" : "/dashboard.html";
}

async function login() {
  const msg = document.getElementById("msg");
  msg.textContent = "Signing in...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.message || "Login failed";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("email", data.user.email);

    window.location.href = data.user.role === "admin" ? "/admin.html" : "/dashboard.html";
  } catch (err) {
    msg.textContent = err.message;
  }
}
