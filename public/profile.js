const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "login.html";
if (role === "admin") window.location.href = "admin.html";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token
  };
}

function goBack() {
  window.location.href = "dashboard.html";
}

function setMsg(text, good = false) {
  const el = document.getElementById("msg");
  el.className = good ? "notice good" : "small";
  el.textContent = text || "";
}

function setValue(id, value, type = "text") {
  const el = document.getElementById(id);
  if (!el) return;
  if (type === "checkbox") el.checked = !!value;
  else el.value = value ?? "";
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile/me", { headers: { Authorization: "Bearer " + token } });
    const data = await res.json();

    if (data.user) {
      setMsg(`Signed in as ${data.user.username || data.user.email || "user"}`, true);
    }

    const p = data.profile || {};
    setValue("dob", p.dob);
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
    setValue("land_holding_acres", p.land_holding_acres);
    setValue("disability_percent", p.disability_percent);

    setValue("is_student", p.is_student, "checkbox");
    setValue("is_farmer", p.is_farmer, "checkbox");
    setValue("minority_status", p.minority_status, "checkbox");
    setValue("women_headed_household", p.women_headed_household, "checkbox");
    setValue("single_parent", p.single_parent, "checkbox");
    setValue("currently_employed", p.currently_employed, "checkbox");
    setValue("aadhaar_verified", p.aadhaar_verified, "checkbox");
    setValue("bank_account_linked", p.bank_account_linked, "checkbox");
  } catch (err) {
    setMsg(err.message);
  }
}

async function saveProfile() {
  try {
    setMsg("Saving...");
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
      land_holding_acres: document.getElementById("land_holding_acres").value || null,
      disability_percent: document.getElementById("disability_percent").value || null,
      is_student: document.getElementById("is_student").checked,
      is_farmer: document.getElementById("is_farmer").checked,
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

    if (!res.ok || !data.success) {
      setMsg(data.message || "Could not save profile.");
      return;
    }

    setMsg("Profile saved.", true);
  } catch (err) {
    setMsg(err.message || "Could not save profile.");
  }
}

loadProfile();
