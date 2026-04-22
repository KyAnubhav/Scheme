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

function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[m]);
}

function profileLine(label, value) {
  return `<div><strong>${esc(label)}:</strong> ${esc(value || "—")}</div>`;
}

function schemeCard(scheme, matched = false) {
  const scope = scheme.state_scope || "National";
  const apply = scheme.application_link ? `<a class="btn" href="${esc(scheme.application_link)}" target="_blank" rel="noreferrer">Apply</a>` : "";
  const website = scheme.official_website ? `<a class="btn secondary" href="${esc(scheme.official_website)}" target="_blank" rel="noreferrer">Website</a>` : "";
  return `
    <article class="scheme-card">
      <header>
        <div>
          <h3>${esc(scheme.scheme_name)}</h3>
          <div class="meta">${esc(scheme.short_title || "")}</div>
        </div>
        ${matched ? '<span class="badge good">Matched</span>' : ''}
      </header>
      <div class="meta">
        ${esc(scheme.category_name || "Category")} · ${esc(scheme.ministry_name || "Ministry")} · ${esc(scope)}
      </div>
      <div class="badges">
        <span class="badge neutral">${esc(scheme.beneficiary_type || "Beneficiary")}</span>
        <span class="badge">${esc(scheme.benefit_type || "Benefit")}</span>
        ${scheme.income_limit ? `<span class="badge warn">Income up to ₹${esc(scheme.income_limit)}</span>` : ""}
      </div>
      <p class="meta" style="margin-top:12px;">${esc(scheme.description || "")}</p>
      <div class="toolbar" style="margin-top:14px;">
        ${apply}
        ${website}
      </div>
    </article>
  `;
}

function renderProfile() {
  const box = document.getElementById("profileSummary");
  const hint = document.getElementById("profileHint");

  if (!profileData) {
    hint.textContent = "Profile missing";
    box.innerHTML = "Open Profile and save your details to unlock matching.";
    return;
  }

  hint.textContent = "Profile saved";
  const p = profileData;
  box.innerHTML = `
    <div class="field-grid three">
      ${profileLine("State", p.state)}
      ${profileLine("District", p.district)}
      ${profileLine("Income", p.annual_family_income ? `₹${p.annual_family_income}` : "—")}
      ${profileLine("Category", p.category)}
      ${profileLine("Education", p.education_level)}
      ${profileLine("Student", p.is_student ? "Yes" : "No")}
      ${profileLine("Farmer", p.is_farmer ? "Yes" : "No")}
      ${profileLine("Disability %", p.disability_percent ?? "—")}
      ${profileLine("Verified", p.aadhaar_verified ? "Aadhaar ✓" : "Aadhaar pending")}
    </div>
  `;
}

function renderSchemes() {
  document.getElementById("matchedCount").textContent = `${matchedData.length} matched`;
  document.getElementById("allCount").textContent = `${allData.length} active`;

  document.getElementById("matchedSchemes").innerHTML = matchedData.length
    ? matchedData.map((s) => schemeCard(s, true)).join("")
    : `<div class="notice">No matching schemes yet. Complete your profile to improve matching.</div>`;

  document.getElementById("allSchemes").innerHTML = allData.length
    ? allData.map((s) => schemeCard(s, false)).join("")
    : `<div class="notice">No active schemes available.</div>`;
}

async function reloadDashboard() {
  try {
    const [matchedRes, allRes, profileRes] = await Promise.all([
      fetch("/api/schemes/matched", { headers: headers() }),
      fetch("/api/schemes/all", { headers: headers() }),
      fetch("/api/profile/me", { headers: headers() })
    ]);

    matchedData = await matchedRes.json();
    allData = await allRes.json();
    const profileJson = await profileRes.json();
    profileData = profileJson.profile || null;

    renderProfile();
    renderSchemes();
  } catch (err) {
    document.getElementById("matchedSchemes").innerHTML = `<div class="notice">${esc(err.message)}</div>`;
    document.getElementById("allSchemes").innerHTML = "";
  }
}

reloadDashboard();
