const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function setMessage(text, kind = "") {
  const el = document.getElementById("message");
  el.textContent = text || "";
  el.style.color = kind === "error" ? "#b91c1c" : "#0f172a";
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function goDashboard() {
  window.location.href = "/dashboard.html";
}

function reloadProfile() {
  loadProfile();
}

function setSelect(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? "";
}

function setCheckbox(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = Boolean(value);
}

async function loadProfile() {
  setMessage("");
  try {
    const res = await fetch("/api/profile/me", { headers: headers() });
    const data = await res.json();

    if (data.profile) {
      const p = data.profile;
      document.getElementById("dob").value = p.dob ? String(p.dob).slice(0, 10) : "";
      setSelect("gender", p.gender);
      setSelect("marital_status", p.marital_status);
      setSelect("category", p.category);
      document.getElementById("state").value = p.state || "";
      document.getElementById("district").value = p.district || "";
      document.getElementById("pincode").value = p.pincode || "";
      document.getElementById("annual_family_income").value = p.annual_family_income ?? "";
      document.getElementById("occupation").value = p.occupation || "";
      document.getElementById("education_level").value = p.education_level || "";
      document.getElementById("institution_name").value = p.institution_name || "";
      document.getElementById("course_name").value = p.course_name || "";
      setSelect("is_student", p.is_student ? "1" : "0");
      setSelect("is_farmer", p.is_farmer ? "1" : "0");
      document.getElementById("land_holding_acres").value = p.land_holding_acres ?? "";
      document.getElementById("disability_percent").value = p.disability_percent ?? "";
      setSelect("minority_status", p.minority_status ? "1" : "0");
      setSelect("women_headed_household", p.women_headed_household ? "1" : "0");
      setSelect("single_parent", p.single_parent ? "1" : "0");
      setSelect("currently_employed", p.currently_employed ? "1" : "0");
      setCheckbox("aadhaar_verified", p.aadhaar_verified);
      setCheckbox("bank_account_linked", p.bank_account_linked);
      document.getElementById("saveState").textContent = "Saved";
    } else {
      document.getElementById("saveState").textContent = "Empty";
    }
  } catch (err) {
    setMessage(err.message, "error");
  }
}

async function saveProfile() {
  setMessage("Saving profile...");
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
      is_student: document.getElementById("is_student").value === "1",
      is_farmer: document.getElementById("is_farmer").value === "1",
      land_holding_acres: document.getElementById("land_holding_acres").value || null,
      disability_percent: document.getElementById("disability_percent").value || null,
      minority_status: document.getElementById("minority_status").value === "1",
      women_headed_household: document.getElementById("women_headed_household").value === "1",
      single_parent: document.getElementById("single_parent").value === "1",
      currently_employed: document.getElementById("currently_employed").value === "1",
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
      setMessage(data.message || "Save failed.", "error");
      return;
    }

    document.getElementById("saveState").textContent = "Saved";
    setMessage("Profile saved.");
  } catch (err) {
    setMessage(err.message, "error");
  }
}

loadProfile();
