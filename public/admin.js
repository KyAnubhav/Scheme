const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token) window.location.href = "/login.html";
if (role !== "admin") window.location.href = "/dashboard.html";

const FIELD_OPTIONS = [
  "annual_family_income",
  "state",
  "district",
  "category",
  "gender",
  "marital_status",
  "occupation",
  "education_level",
  "is_student",
  "is_farmer",
  "land_holding_acres",
  "disability_percent",
  "minority_status",
  "women_headed_household",
  "single_parent",
  "currently_employed",
  "aadhaar_verified",
  "bank_account_linked"
];

const BEN_TYPES = [
  ["general", "General"],
  ["student", "Student"],
  ["farmer", "Farmer"],
  ["women", "Women"],
  ["disabled", "Disabled"],
  ["minority", "Minority"],
  ["senior_citizen", "Senior citizen"],
  ["women_headed_household", "Women-headed household"]
];

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"]+/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[m]);
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function ruleRow(rule = {}) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <div class="field mini">
      <label>Field</label>
      <select class="field-name"></select>
    </div>
    <div class="field mini">
      <label>Operator</label>
      <select class="operator-name">
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value="<"><</option>
        <option value="<="><=</option>
        <option value=">">&gt;</option>
        <option value=">=">>=</option>
        <option value="IN">IN</option>
        <option value="BETWEEN">BETWEEN</option>
        <option value="LIKE">LIKE</option>
      </select>
    </div>
    <div class="field mini">
      <label>Value 1</label>
      <input class="value1" type="text" placeholder="Value">
    </div>
    <div class="field mini">
      <label>Value 2</label>
      <input class="value2" type="text" placeholder="Optional">
    </div>
    <button class="btn secondary small" type="button">Remove</button>
  `;

  const fieldSelect = row.querySelector(".field-name");
  fieldSelect.innerHTML = FIELD_OPTIONS.map((f) => `<option value="${f}">${f}</option>`).join("");
  fieldSelect.value = rule.field_name || FIELD_OPTIONS[0];
  row.querySelector(".operator-name").value = rule.operator_name || "=";
  row.querySelector(".value1").value = rule.value1 || "";
  row.querySelector(".value2").value = rule.value2 || "";
  row.querySelector("button").onclick = () => row.remove();
  return row;
}

function docRow(doc = {}) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <div class="field mini">
      <label>Document</label>
      <input class="document-name" type="text" placeholder="Document name">
    </div>
    <div class="field mini">
      <label>Code</label>
      <input class="document-code" type="text" placeholder="Code">
    </div>
    <div class="field mini">
      <label>Status</label>
      <select class="mandatory">
        <option value="1">Mandatory</option>
        <option value="0">Optional</option>
      </select>
    </div>
    <div class="field mini">
      <label>Notes</label>
      <input class="notes" type="text" placeholder="Notes">
    </div>
    <button class="btn secondary small" type="button">Remove</button>
  `;
  row.querySelector(".document-name").value = doc.document_name || "";
  row.querySelector(".document-code").value = doc.document_code || "";
  row.querySelector(".mandatory").value = doc.mandatory === false ? "0" : "1";
  row.querySelector(".notes").value = doc.notes || "";
  row.querySelector("button").onclick = () => row.remove();
  return row;
}

function addRule() {
  document.getElementById("rules").appendChild(ruleRow());
}

function addDocument() {
  document.getElementById("docs").appendChild(docRow());
}

async function loadMeta() {
  const [minRes, catRes, overRes, schemeRes] = await Promise.all([
    fetch("/api/meta/ministries", { headers: { Authorization: `Bearer ${token}` } }),
    fetch("/api/meta/categories", { headers: { Authorization: `Bearer ${token}` } }),
    fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${token}` } }),
    fetch("/api/admin/schemes", { headers: { Authorization: `Bearer ${token}` } })
  ]);

  const ministries = await minRes.json();
  const categories = await catRes.json();
  const overview = await overRes.json();
  const schemes = await schemeRes.json();

  document.getElementById("ministry_id").innerHTML = ministries
    .map((m) => `<option value="${m.id}">${escapeHtml(m.ministry_name)}</option>`).join("");
  document.getElementById("category_id").innerHTML = categories
    .map((c) => `<option value="${c.id}">${escapeHtml(c.category_name)}</option>`).join("");
  document.getElementById("beneficiary_type").innerHTML = BEN_TYPES
    .map(([value, label]) => `<option value="${value}">${label}</option>`).join("");

  document.getElementById("adminStats").innerHTML = `
    <div class="stat"><div class="label">Users</div><div class="value">${overview.users}</div></div>
    <div class="stat"><div class="label">Schemes</div><div class="value">${overview.schemes}</div></div>
    <div class="stat"><div class="label">Profiles</div><div class="value">${overview.profiles}</div></div>
    <div class="stat"><div class="label">Notifications</div><div class="value">${overview.notifications}</div></div>
  `;

  const box = document.getElementById("schemes");
  box.innerHTML = schemes.length
    ? schemes.map((s) => `
        <div class="scheme-card">
          <div class="scheme-top">
            <div>
              <h4 class="scheme-title">${escapeHtml(s.scheme_name)}</h4>
              <div class="badges">
                <span class="badge">${escapeHtml(s.category_name)}</span>
                <span class="badge gray">${escapeHtml(s.ministry_name)}</span>
                <span class="badge green">${s.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <span class="badge">${escapeHtml(s.scheme_code)}</span>
          </div>
          <div class="scheme-meta">
            <div><span>Beneficiary:</span> ${escapeHtml(s.beneficiary_type || "—")}</div>
            <div><span>Limit:</span> ${s.income_limit ? `₹${escapeHtml(s.income_limit)}` : "—"}</div>
            <div><span>Description:</span> ${escapeHtml(s.short_title || s.description || "")}</div>
          </div>
        </div>
      `).join("")
    : `<div class="card">No schemes yet.</div>`;
}

function refreshAdmin() {
  loadMeta();
}

async function submitScheme() {
  const msg = document.getElementById("msg");
  msg.textContent = "Publishing...";

  const rules = Array.from(document.querySelectorAll("#rules .rule-row")).map((row) => ({
    field_name: row.querySelector(".field-name").value,
    operator_name: row.querySelector(".operator-name").value,
    value1: row.querySelector(".value1").value.trim(),
    value2: row.querySelector(".value2").value.trim(),
    mandatory: true,
    notes: ""
  }));

  const required_documents = Array.from(document.querySelectorAll("#docs .rule-row")).map((row) => ({
    document_name: row.querySelector(".document-name").value.trim(),
    document_code: row.querySelector(".document-code").value.trim(),
    mandatory: row.querySelector(".mandatory").value === "1",
    notes: row.querySelector(".notes").value.trim()
  })).filter(d => d.document_name);

  const body = {
    scheme_code: document.getElementById("scheme_code").value.trim() || `SCH-${Date.now()}`,
    scheme_name: document.getElementById("scheme_name").value.trim(),
    short_title: document.getElementById("short_title").value.trim(),
    description: document.getElementById("description").value.trim(),
    ministry_id: Number(document.getElementById("ministry_id").value),
    category_id: Number(document.getElementById("category_id").value),
    beneficiary_type: document.getElementById("beneficiary_type").value,
    target_audience: "",
    application_mode: document.getElementById("application_mode").value,
    benefit_type: document.getElementById("benefit_type").value,
    benefit_amount: document.getElementById("benefit_amount").value || null,
    income_limit: document.getElementById("income_limit").value || null,
    age_min: null,
    age_max: null,
    state_scope: document.getElementById("state_scope").value,
    launch_date: null,
    start_date: null,
    end_date: null,
    deadline: document.getElementById("deadline").value || null,
    official_website: document.getElementById("official_website").value.trim(),
    application_link: document.getElementById("application_link").value.trim(),
    documents_link: document.getElementById("documents_link").value.trim(),
    is_active: true,
    eligibility_rules: rules,
    required_documents
  };

  if (!body.scheme_name || !body.description) {
    msg.textContent = "Scheme name and description are required.";
    return;
  }

  try {
    const res = await fetch("/api/admin/schemes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    msg.textContent = data.message || "Done";
    if (data.success) {
      document.getElementById("rules").innerHTML = "";
      document.getElementById("docs").innerHTML = "";
      addRule();
      addDocument();
      await loadMeta();
    }
  } catch (err) {
    msg.textContent = err.message;
  }
}

addRule();
addDocument();
loadMeta();
