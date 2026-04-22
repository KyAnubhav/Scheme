function setMessage(text, kind = "") {
  const el = document.getElementById("message");
  el.textContent = text || "";
  el.style.color = kind === "error" ? "#b91c1c" : "#0f172a";
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setMessage("Enter email and password.", "error");
    return;
  }

  setMessage("Signing in...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      setMessage(data.message || "Login failed.", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role || "user");
    localStorage.setItem("username", data.user.username || "");

    window.location.href = data.user.role === "admin" ? "/admin.html" : "/dashboard.html";
  } catch (err) {
    setMessage(err.message, "error");
  }
}
