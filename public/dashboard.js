const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

let matchedData = [];
let allData = [];
let profileData = null;

function headers() {
  return { Authorization: `Bearer ${token}` };
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function goProfile() {
  window.location.href = "/profile.html";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"]+/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[m]);
}

function schemeHtml(s, accent = "") {
  const state = s.state_scope || "National";
  return `
    <div class="scheme-card">
      <div class="scheme-top">
        <div>
          <h4 class="scheme-title">${escapeHtml(s.scheme_name)}</h4>
          <div class="badges">
            <span class="badge">${escapeHtml(s.category_name || "Category")}</span>
            <span class="badge gray">${escapeHtml(s.ministry_name || "Ministry")}</span>
            <span class="badge green">${escapeHtml(state)}</span>
          </div>
        </div>
        ${accent ? `<span class="badge">${escapeHtml(accent)}</span>` : ""}
      </div>
      <div class="scheme-meta">
        <div><span>Beneficiary:</span> ${escapeHtml(s.beneficiary_type || "—")}</div>
        <div><span>Benefit:</span> ${escapeHtml(s.benefit_type || "—")}${s.benefit_amount ? ` · ₹${escapeHtml(s.benefit_amount)}` : ""}</div>
        <div><span>Income limit:</span> ${s.income_limit ? `₹${escapeHtml(s.income_limit)}` : "—"}</div>
        <div><span>Deadline:</span> ${escapeHtml(s.deadline || "Open")}</div>
      </div>
      <div class="scheme-actions">
        ${s.application_link ? `<a class="btn small" href="${escapeHtml(s.application_link)}" target="_blank" rel="noopener">Apply</a>` : ""}
        ${s.official_website ? `<a class="btn secondary small" href="${escapeHtml(s.official_website)}" target="_blank" rel="noopener">Website</a>` : ""}
      </div>
    </div>
  `;
}

function fillStats() {
  const stats = document.getElementById("stats");
  const values = [
    ["Matched", matchedData.length],
    ["Active", allData.length],
    ["Profile", profileData ? "Complete" : "Missing"],
    ["Role", localStorage.getItem("role") || "user"]
  ];
  stats.innerHTML = values.map(([label, value]) => `
    <div class="stat">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `).join("");
}

function populateCategoryFilter() {
  const sel = document.getElementById("categoryFilter");
  const categories = [...new Set(allData.map(s => s.category_name).filter(Boolean))].sort();
  sel.innerHTML = `<option value="">All</option>` + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function renderSchemes() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const state = document.getElementById("stateFilter").value;

  const matches = matchedData.filter((s) => {
    const text = `${s.scheme_name} ${s.ministry_name || ""} ${s.category_name || ""}`.toLowerCase();
    return (!q || text.includes(q)) && (!category || s.category_name === category) && (!state || (s.state_scope || "National") === state);
  });
  const all = allData.filter((s) => {
    const text = `${s.scheme_name} ${s.ministry_name || ""} ${s.category_name || ""}`.toLowerCase();
    return (!q || text.includes(q)) && (!category || s.category_name === category) && (!state || (s.state_scope || "National") === state);
  });

  document.getElementById("matchedSchemes").innerHTML = matches.length ? matches.map(s => schemeHtml(s, "Matched")).join("") : `<div class="card">No matching schemes yet.</div>`;
  document.getElementById("allSchemes").innerHTML = all.length ? all.map(s => schemeHtml(s)).join("") : `<div class="card">No schemes found.</div>`;
}

function renderProfile() {
  const box = document.getElementById("profileBox");
  if (!profileData) {
    box.innerHTML = `<div class="card">No profile found. Open Profile and add your details.</div>`;
    return;
  }

  const p = profileData;
  const items = [
    ["State", p.state || "—"],
    ["District", p.district || "—"],
    ["Income", p.annual_family_income ? `₹${p.annual_family_income}` : "—"],
    ["Education", p.education_level || "—"],
    ["Student", p.is_student ? "Yes" : "No"],
    ["Farmer", p.is_farmer ? "Yes" : "No"],
    ["Category", p.category || "—"],
    ["Disability %", p.disability_percent ?? "—"]
  ];

  box.innerHTML = items.map(([label, value]) => `
    <div class="scheme-card">
      <div class="muted small">${escapeHtml(label)}</div>
      <div style="font-weight:700; margin-top:6px;">${escapeHtml(value)}</div>
    </div>
  `).join("");
}

function clearFilters() {
  document.getElementById("search").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("stateFilter").value = "";
  renderSchemes();
}

async function loadDashboard() {
  try {
    const [matchedRes, allRes, profileRes] = await Promise.all([
      fetch("/api/schemes/matched", { headers: headers() }),
      fetch("/api/schemes/all", { headers: headers() }),
      fetch("/api/profile/me", { headers: headers() })
    ]);

    matchedData = await matchedRes.json();
    allData = await allRes.json();
    const profileJson = await profileRes.json();
    profileData = profileJson.profile;

    populateCategoryFilter();
    renderProfile();
    fillStats();
    renderSchemes();
  } catch (err) {
    document.getElementById("matchedSchemes").innerHTML = `<div class="card">${escapeHtml(err.message)}</div>`;
  }
}

function refreshDashboard() {
  loadDashboard();
}

loadDashboard();
