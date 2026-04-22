const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "login.html";
if (role === "admin") window.location.href = "admin.html";

let profile = null;
let matchedSchemes = [];
let allSchemes = [];

function headers() {
  return { Authorization: "Bearer " + token };
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function goProfile() {
  window.location.href = "profile.html";
}

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function textForScheme(s) {
  return `${s.scheme_name || ""} ${s.short_title || ""} ${s.description || ""} ${s.category_name || ""} ${s.state_scope || ""}`.toLowerCase();
}

function applyFilters() {
  renderLists();
}

function clearFilters() {
  document.getElementById("search").value = "";
  document.getElementById("filterCategory").value = "";
  renderLists();
}

function completeness() {
  if (!profile) return 0;
  const keys = ["dob","gender","marital_status","category","state","district","pincode","annual_family_income","occupation","education_level","is_student","is_farmer"];
  const filled = keys.filter(k => {
    const v = profile[k];
    return v !== null && v !== undefined && v !== "";
  }).length;
  return Math.round((filled / keys.length) * 100);
}

function profileSnapshotHtml() {
  if (!profile) {
    return `<div class="notice warn">No profile saved yet. Add your details so scheme matching becomes accurate.</div>`;
  }
  const age = calcAge(profile.dob);
  return `
    <div class="badges" style="margin-bottom:10px;">
      <span class="badge">State: ${profile.state || "-"}</span>
      <span class="badge">Category: ${profile.category || "-"}</span>
      <span class="badge">Age: ${age ?? "-"}</span>
    </div>
    <div class="small" style="line-height:1.8;">
      <div><b>Email:</b> ${profile.email || "-"}</div>
      <div><b>Income:</b> ${profile.annual_family_income ?? "-"}</div>
      <div><b>Education:</b> ${profile.education_level || "-"}</div>
      <div><b>Occupation:</b> ${profile.occupation || "-"}</div>
      <div><b>Student:</b> ${profile.is_student ? "Yes" : "No"}</div>
      <div><b>Farmer:</b> ${profile.is_farmer ? "Yes" : "No"}</div>
      <div><b>Disability:</b> ${profile.disability_percent ?? "-"}%</div>
    </div>
  `;
}

function cardHtml(s, matched) {
  const state = s.state_scope || "National";
  const deadline = s.deadline ? new Date(s.deadline).toLocaleDateString() : "Open";
  return `
    <div class="scheme-card">
      <div class="meta">
        <span class="badge">${matched ? "Matched" : "Active"}</span>
        <span class="badge">${s.category_name || "General"}</span>
        <span class="badge">${s.ministry_name || "Ministry"}</span>
        <span class="badge">${state}</span>
      </div>
      <h5>${s.scheme_name || "-"}</h5>
      <div class="desc">${s.short_title || s.description || "No description provided."}</div>
      <div class="foot">
        <span>Benefit: ${s.benefit_type || "-"}</span>
        <span>Limit: ${s.income_limit ?? "N/A"}</span>
        <span>Deadline: ${deadline}</span>
      </div>
      <div class="btn-row" style="margin-top:12px;">
        ${s.application_link ? `<a class="btn" href="${s.application_link}" target="_blank" rel="noopener">Apply</a>` : ""}
        ${s.official_website ? `<a class="btn secondary" href="${s.official_website}" target="_blank" rel="noopener">Official site</a>` : ""}
      </div>
    </div>
  `;
}

function setKpis() {
  document.getElementById("kpiMatched").textContent = matchedSchemes.length;
  document.getElementById("kpiActive").textContent = allSchemes.length;
  document.getElementById("kpiProfile").textContent = `${completeness()}%`;
}

function renderLists() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const cat = document.getElementById("filterCategory").value;

  const filtered = (s) => {
    if (q && !textForScheme(s).includes(q)) return false;
    if (cat && s.category_name !== cat) return false;
    return true;
  };

  const matchedBox = document.getElementById("matched");
  const allBox = document.getElementById("allSchemes");

  const matched = matchedSchemes.filter(filtered);
  const all = allSchemes.filter(filtered);

  matchedBox.innerHTML = matched.length ? matched.map(s => cardHtml(s, true)).join("") : `<div class="notice">No matched schemes found.</div>`;
  allBox.innerHTML = all.length ? all.map(s => cardHtml(s, matchedSchemes.some(m => m.id === s.id))).join("") : `<div class="notice">No active schemes found.</div>`;
}

async function loadDashboard() {
  try {
    const [profileRes, matchedRes, allRes, catRes] = await Promise.all([
      fetch("/api/profile/me", { headers: headers() }),
      fetch("/api/schemes/matched", { headers: headers() }),
      fetch("/api/schemes/all", { headers: headers() }),
      fetch("/api/meta/categories", { headers: headers() })
    ]);

    const profileData = await profileRes.json();
    const categories = await catRes.json();

    profile = profileData.profile || {};
    if (profileData.user) profile.email = profileData.user.email;
    matchedSchemes = await matchedRes.json();
    allSchemes = await allRes.json();

    const catSelect = document.getElementById("filterCategory");
    catSelect.innerHTML = `<option value="">All categories</option>` + categories.map(c => `<option value="${c.category_name}">${c.category_name}</option>`).join("");

    document.getElementById("profileSnapshot").innerHTML = profileSnapshotHtml();
    document.getElementById("profileStatus").textContent = profileData.profile ? "Profile ready" : "Profile missing";
    setKpis();
    renderLists();

    document.getElementById("search").addEventListener("input", renderLists);
    document.getElementById("filterCategory").addEventListener("change", renderLists);
  } catch (err) {
    document.getElementById("matched").innerHTML = `<div class="notice bad">${err.message}</div>`;
  }
}

loadDashboard();
