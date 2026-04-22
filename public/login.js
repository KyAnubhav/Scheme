function setMsg(text, kind = "") {
  const box = document.getElementById("msg");
  box.style.display = "block";
  box.className = `notice ${kind}`.trim();
  box.textContent = text;
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setMsg("Enter email and password.", "warn");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!data.success) {
      setMsg(data.message || "Login failed.", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user?.role || "user");
    setMsg("Login successful.", "ok");
    window.location.href = data.user?.role === "admin" ? "/admin.html" : "/dashboard.html";
  } catch (err) {
    setMsg(err.message || "Network error.", "error");
  }
}
