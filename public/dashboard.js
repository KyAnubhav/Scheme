const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "/login.html";
if (role === "admin") window.location.href = "/admin.html";

let allSchemes = [];
let matchedSchemes = [];
let profile = null;

function headers() {
  return { Authorization: "Bearer " + token };
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function goProfile() {
  window.location.href = "/profile.html";
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

function setStats() {
  const box = document.getElementById("stats");
  const profileComplete = profile ? Math.round(
    ["dob","state","annual_family_income","education_level","occupation"].filter(k => profile[k]).length / 5 * 100
  ) : 0;
  box.innerHTML = `
    <div class="stat"><div class="label">Matched schemes</div><div class="value">${matchedSchemes.length}</div></div>
    <div class="stat"><div class="label">Active schemes</div><div class="value">${allSchemes.length}</div></div>
    <div class="stat"><div class="label">Profile completeness</div><div class="value">${profileComplete}%</div></div>
    <div class="stat"><div class="label">Age</div><div class="value">${profile?.dob ? calcAge(profile.dob) : "-"}</div></div>
  `;
}

function schemeCard(s, matched) {
  const deadline = s.deadline ? new Date(s.deadline).toLocaleDateString() : "Open";
  const state = s.state_scope || "National";
  const badge = matched ? `<span class="chip green">Eligible</span>` : `<span class="chip yellow">Browse</span>`;
  return `
    <div class="item">
      <div class="meta">
        ${badge}
        <span class="chip">${s.category_name}</span>
        <span class="chip">${s.ministry_name}</span>
        <span class="chip">${state}</span>
      </div>
      <h3>${s.scheme_name}</h3>
      <p class="desc">${s.description || ""}</p>
      <div class="meta">
        <span class="chip">Benefit: ${s.benefit_type || "-"}</span>
        <span class="chip">Limit: ${s.income_limit || "N/A"}</span>
        <span class="chip">Deadline: ${deadline}</span>
      </div>
      <div class="actions">
        <a class="btn" href="${s.application_link || s.official_website || "#"}" target="_blank">Open scheme</a>
      </div>
    </div>
  `;
}

function renderProfileSnapshot() {
  const box = document.getElementById("profileSnapshot");
  if (!profile) {
    box.innerHTML = `<p>No profile saved yet.</p><p class="note">Go to Profile and complete the details.</p>`;
    return;
  }

  const age = calcAge(profile.dob);
  box.innerHTML = `
    <div class="meta" style="margin-bottom:10px;">
      <span class="chip">State: ${profile.state || "-"}</span>
      <span class="chip">Category: ${profile.category || "-"}</span>
      <span class="chip">Age: ${age ?? "-"}</span>
    </div>
    <p><strong>Income:</strong> ${profile.annual_family_income ?? "-"}</p>
    <p><strong>Occupation:</strong> ${profile.occupation || "-"}</p>
    <p><strong>Education:</strong> ${profile.education_level || "-"}</p>
    <p><strong>Student:</strong> ${profile.is_student ? "Yes" : "No"}</p>
    <p><strong>Farmer:</strong> ${profile.is_farmer ? "Yes" : "No"}</p>
    <p><strong>Disabled:</strong> ${profile.disability_percent ?? 0}%</p>
  `;
}

function renderLists() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const cat = document.getElementById("filterCategory").value;
  const state = document.getElementById("filterState").value;

  const f = (s) => {
    const text = `${s.scheme_name} ${s.description} ${s.ministry_name} ${s.category_name} ${s.state_scope || ""}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (cat && s.category_name !== cat) return false;
    if (state && (s.state_scope || "National") !== state) return false;
    return true;
  };

  const matchedBox = document.getElementById("matched");
  const allBox = document.getElementById("allSchemes");

  const matched = matchedSchemes.filter(f);
  const all = allSchemes.filter(f);

  matchedBox.innerHTML = matched.length ? matched.map(s => schemeCard(s, true)).join("") : `<p>No matched schemes after filters.</p>`;
  allBox.innerHTML = all.length ? all.map(s => schemeCard(s, matchedSchemes.some(m => m.id === s.id))).join("") : `<p>No schemes after filters.</p>`;
}

async function refreshSchemes() {
  try {
    const [profileRes, matchedRes, allRes, catRes] = await Promise.all([
      fetch("/api/profile/me", { headers: headers() }),
      fetch("/api/schemes/matched", { headers: headers() }),
      fetch("/api/schemes/all", { headers: headers() }),
      fetch("/api/meta/categories", { headers: headers() })
    ]);

    const profileData = await profileRes.json();
    profile = profileData.profile;

    matchedSchemes = await matchedRes.json();
    allSchemes = await allRes.json();

    const categories = await catRes.json();
    const catSelect = document.getElementById("filterCategory");
    catSelect.innerHTML = `<option value="">All categories</option>` + categories.map(c => `<option>${c.category_name}</option>`).join("");

    setStats();
    renderProfileSnapshot();
    renderLists();
  } catch (err) {
    document.getElementById("matched").innerHTML = `<p>${err.message}</p>`;
  }
}

refreshSchemes();
