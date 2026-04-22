const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "/login.html";
if (role === "admin") window.location.href = "/admin.html";

function headers() {
  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };
}

function goDashboard() {
  window.location.href = "/dashboard.html";
}

function toBool(v) {
  return String(v) === "1";
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile/me", { headers: { Authorization: "Bearer " + token } });
    const data = await res.json();
    const p = data.profile || {};
    if (!p) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };

    set("dob", p.dob ? String(p.dob).slice(0,10) : "");
    set("gender", p.gender || "");
    set("marital_status", p.marital_status || "");
    set("category", p.category || "");
    set("state", p.state || "");
    set("district", p.district || "");
    set("pincode", p.pincode || "");
    set("annual_family_income", p.annual_family_income || "");
    set("occupation", p.occupation || "");
    set("education_level", p.education_level || "");
    set("institution_name", p.institution_name || "");
    set("course_name", p.course_name || "");
    set("is_student", p.is_student ? "1" : "0");
    set("is_farmer", p.is_farmer ? "1" : "0");
    set("land_holding_acres", p.land_holding_acres || "");
    set("disability_percent", p.disability_percent || "");
    set("minority_status", p.minority_status ? "1" : "0");
    set("women_headed_household", p.women_headed_household ? "1" : "0");
    set("single_parent", p.single_parent ? "1" : "0");
    set("currently_employed", p.currently_employed ? "1" : "0");
    set("aadhaar_verified", p.aadhaar_verified ? "1" : "0");
    set("bank_account_linked", p.bank_account_linked ? "1" : "0");
  } catch (err) {
    document.getElementById("msg").textContent = err.message;
  }
}

async function saveProfile() {
  const msg = document.getElementById("msg");
  msg.textContent = "Saving...";

  const payload = {
    dob: document.getElementById("dob").value,
    gender: document.getElementById("gender").value,
    marital_status: document.getElementById("marital_status").value,
    category: document.getElementById("category").value,
    state: document.getElementById("state").value,
    district: document.getElementById("district").value,
    pincode: document.getElementById("pincode").value,
    annual_family_income: document.getElementById("annual_family_income").value,
    occupation: document.getElementById("occupation").value,
    education_level: document.getElementById("education_level").value,
    institution_name: document.getElementById("institution_name").value,
    course_name: document.getElementById("course_name").value,
    is_student: toBool(document.getElementById("is_student").value),
    is_farmer: toBool(document.getElementById("is_farmer").value),
    land_holding_acres: document.getElementById("land_holding_acres").value,
    disability_percent: document.getElementById("disability_percent").value,
    minority_status: toBool(document.getElementById("minority_status").value),
    women_headed_household: toBool(document.getElementById("women_headed_household").value),
    single_parent: toBool(document.getElementById("single_parent").value),
    currently_employed: toBool(document.getElementById("currently_employed").value),
    aadhaar_verified: toBool(document.getElementById("aadhaar_verified").value),
    bank_account_linked: toBool(document.getElementById("bank_account_linked").value),
  };

  try {
    const res = await fetch("/api/profile/me", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    msg.textContent = data.message || "Saved";
    setTimeout(() => window.location.href = "/dashboard.html", 700);
  } catch (err) {
    msg.textContent = err.message;
  }
}

loadProfile();
