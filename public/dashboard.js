const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

let matchedData = [];
let allData = [];
let profileData = null;
let userData = null;

function headers() {
  return { Authorization: `Bearer ${token}` };
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function schemeCard(s, tag = "") {
  const state = s.state_scope || "National";
  return `
    <article class="scheme-card">
      <div class="section-title" style="margin:0;align-items:flex-start;">
        <div>
          <h4>${escapeHtml(s.scheme_name)}</h4>
          <div class="meta">
            <span class="badge gray">${escapeHtml(s.category_name || "Category")}</span>
            <span class="badge gray">${escapeHtml(s.ministry_name || "Ministry")}</span>
            <span class="badge gray">${escapeHtml(state)}</span>
          </div>
        </div>
        ${tag ? `<span class="badge green">${escapeHtml(tag)}</span>` : ""}
      </div>
      <p>${escapeHtml(s.short_title || s.description || "")}</p>
      <div class="meta">
        <span>Beneficiary: ${escapeHtml(s.beneficiary_type || "—")}</span>
        <span>Benefit: ${escapeHtml(s.benefit_type || "—")}${s.benefit_amount ? ` · ₹${escapeHtml(s.benefit_amount)}` : ""}</span>
        <span>Income limit: ${s.income_limit ? `₹${escapeHtml(s.income_limit)}` : "—"}</span>
        <span>Deadline: ${escapeHtml(s.deadline || "Open")}</span>
      </div>
      <div class="topbar-actions">
        ${s.application_link ? `<a class="btn btn-primary btn-small" target="_blank" rel="noreferrer" href="${escapeHtml(s.application_link)}">Apply</a>` : ""}
        ${s.official_website ? `<a class="btn btn-ghost btn-small" target="_blank" rel="noreferrer" href="${escapeHtml(s.official_website)}">Website</a>` : ""}
      </div>
    </article>
  `;
}

function renderStats() {
  const stats = document.getElementById("stats");
  const role = localStorage.getItem("role") || "user";
  stats.innerHTML = [
    ["Matched schemes", matchedData.length],
    ["Active schemes", allData.length],
    ["Profile", profileData ? "Saved" : "Missing"]
  ].map(([label, value]) => `
    <div class="kpi card">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `).join("");
}

function renderProfile() {
  const box = document.getElementById("profileBox");
  const status = document.getElementById("profileStatus");

  if (!profileData) {
    status.textContent = "Missing";
    status.className = "badge red";
    box.innerHTML = `<div class="empty">No profile found. Add your details to get scheme matches.</div>`;
    return;
  }

  status.textContent = "Saved";
  status.className = "badge green";

  const p = profileData;
  box.innerHTML = `
    <div class="grid cols-2" style="gap:10px;">
      <div><div class="small">State</div><strong>${escapeHtml(p.state || "—")}</strong></div>
      <div><div class="small">District</div><strong>${escapeHtml(p.district || "—")}</strong></div>
      <div><div class="small">Income</div><strong>${p.annual_family_income ? `₹${escapeHtml(p.annual_family_income)}` : "—"}</strong></div>
      <div><div class="small">Category</div><strong>${escapeHtml(p.category || "—")}</strong></div>
      <div><div class="small">Education</div><strong>${escapeHtml(p.education_level || "—")}</strong></div>
      <div><div class="small">Student</div><strong>${p.is_student ? "Yes" : "No"}</strong></div>
    </div>
  `;
}

function renderSchemes() {
  document.getElementById("matchedCount").textContent = matchedData.length;
  document.getElementById("allCount").textContent = allData.length;

  document.getElementById("matchedSchemes").innerHTML = matchedData.length
    ? matchedData.map(s => schemeCard(s, "Matched")).join("")
    : `<div class="empty">No matches yet. Complete your profile to see eligible schemes.</div>`;

  document.getElementById("allSchemes").innerHTML = allData.length
    ? allData.map(s => schemeCard(s)).join("")
    : `<div class="empty">No active schemes available right now.</div>`;
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
    userData = profileJson.user;

    renderStats();
    renderProfile();
    renderSchemes();
  } catch (err) {
    document.getElementById("matchedSchemes").innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

loadDashboard();
