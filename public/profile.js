const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function setMsg(text, kind = "") {
  const box = document.getElementById("msg");
  box.style.display = "block";
  box.className = `notice ${kind}`.trim();
  box.textContent = text;
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === "checkbox") el.checked = !!value;
  else el.value = value ?? "";
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile/me", { headers: headers() });
    const data = await res.json();

    const user = data.user || {};
    const profile = data.profile || null;

    document.getElementById("accountBox").innerHTML = profile
      ? `
        <div class="stack">
          <div><span class="small">Name</span><div><strong>${user.username || "—"}</strong></div></div>
          <div><span class="small">Email</span><div><strong>${user.email || "—"}</strong></div></div>
          <div><span class="small">Phone</span><div><strong>${user.phone || "—"}</strong></div></div>
        </div>
      `
      : `<div class="empty">No profile saved yet. Fill the form and save.</div>`;

    if (!profile) {
      document.getElementById("saveStatus").textContent = "New";
      document.getElementById("saveStatus").className = "badge gray";
      return;
    }

    document.getElementById("saveStatus").textContent = "Saved";
    document.getElementById("saveStatus").className = "badge green";

    [
      "dob","gender","marital_status","category","state","district","pincode",
      "annual_family_income","occupation","education_level","institution_name","course_name",
      "land_holding_acres","disability_percent"
    ].forEach((id) => setVal(id, profile[id]));

    [
      "is_student","is_farmer","minority_status","women_headed_household",
      "single_parent","currently_employed","aadhaar_verified","bank_account_linked"
    ].forEach((id) => setVal(id, profile[id]));
  } catch (err) {
    setMsg(err.message, "error");
  }
}

async function saveProfile() {
  try {
    const payload = {
      dob: document.getElementById("dob").value || null,
      gender: document.getElementById("gender").value || null,
      marital_status: document.getElementById("marital_status").value || null,
      category: document.getElementById("category").value || null,
      state: document.getElementById("state").value.trim() || null,
      district: document.getElementById("district").value.trim() || null,
      pincode: document.getElementById("pincode").value.trim() || null,
      annual_family_income: document.getElementById("annual_family_income").value || null,
      occupation: document.getElementById("occupation").value.trim() || null,
      education_level: document.getElementById("education_level").value.trim() || null,
      institution_name: document.getElementById("institution_name").value.trim() || null,
      course_name: document.getElementById("course_name").value.trim() || null,
      is_student: document.getElementById("is_student").checked,
      is_farmer: document.getElementById("is_farmer").checked,
      land_holding_acres: document.getElementById("land_holding_acres").value || null,
      disability_percent: document.getElementById("disability_percent").value || null,
      minority_status: document.getElementById("minority_status").checked,
      women_headed_household: document.getElementById("women_headed_household").checked,
      single_parent: document.getElementById("single_parent").checked,
      currently_employed: document.getElementById("currently_employed").checked,
      aadhaar_verified: document.getElementById("aadhaar_verified").checked,
      bank_account_linked: document.getElementById("bank_account_linked").checked
    };

    const res = await fetch("/api/profile/me", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) {
      setMsg(data.message || "Could not save profile.", "error");
      return;
    }

    setMsg("Profile saved.", "ok");
    document.getElementById("saveStatus").textContent = "Saved";
    document.getElementById("saveStatus").className = "badge green";
  } catch (err) {
    setMsg(err.message, "error");
  }
}

loadProfile();
