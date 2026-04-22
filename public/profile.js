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

function backToDashboard() {
  window.location.href = "/dashboard.html";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? "";
}

async function loadProfile() {
  const msg = document.getElementById("msg");
  try {
    const res = await fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const p = data.profile || {};

    setValue("dob", p.dob?.slice?.(0, 10));
    setValue("gender", p.gender);
    setValue("marital_status", p.marital_status);
    setValue("category", p.category);
    setValue("state", p.state);
    setValue("district", p.district);
    setValue("pincode", p.pincode);
    setValue("annual_family_income", p.annual_family_income);
    setValue("occupation", p.occupation);
    setValue("education_level", p.education_level);
    setValue("institution_name", p.institution_name);
    setValue("course_name", p.course_name);
    setValue("is_student", p.is_student ? "1" : "0");
    setValue("is_farmer", p.is_farmer ? "1" : "0");
    setValue("land_holding_acres", p.land_holding_acres);
    setValue("disability_percent", p.disability_percent);
    setValue("minority_status", p.minority_status ? "1" : "0");
    setValue("women_headed_household", p.women_headed_household ? "1" : "0");
    setValue("single_parent", p.single_parent ? "1" : "0");
    setValue("currently_employed", p.currently_employed ? "1" : "0");
    setValue("aadhaar_verified", p.aadhaar_verified ? "1" : "0");
    setValue("bank_account_linked", p.bank_account_linked ? "1" : "0");
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function saveProfile() {
  const msg = document.getElementById("msg");
  const body = {
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
    aadhaar_verified: document.getElementById("aadhaar_verified").value === "1",
    bank_account_linked: document.getElementById("bank_account_linked").value === "1"
  };

  msg.textContent = "Saving...";
  try {
    const res = await fetch("/api/profile/me", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    msg.textContent = data.message || "Saved.";
  } catch (err) {
    msg.textContent = err.message;
  }
}

loadProfile();
