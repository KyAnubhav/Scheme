const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "/login.html";
if (role !== "admin") window.location.href = "/dashboard.html";

const FIELD_OPTIONS = [
  "age",
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

function headers() {
  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function ruleRow(rule = {}) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <select class="field-name">${FIELD_OPTIONS.map(f => `<option ${rule.field_name===f?"selected":""}>${f}</option>`).join("")}</select>
    <select class="operator-name">
      ${["=","!=","<","<=",">",">=","IN","BETWEEN","LIKE"].map(o => `<option ${rule.operator_name===o?"selected":""}>${o}</option>`).join("")}
    </select>
    <input class="value1" type="text" placeholder="Value 1" value="${rule.value1 || ""}">
    <input class="value2" type="text" placeholder="Value 2 (for BETWEEN)" value="${rule.value2 || ""}">
    <button class="mini-btn" type="button">Remove</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  return row;
}

function docRow(doc = {}) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <input class="document-name" type="text" placeholder="Document name" value="${doc.document_name || ""}">
    <input class="document-code" type="text" placeholder="Code" value="${doc.document_code || ""}">
    <select class="mandatory">
      <option value="1" ${doc.mandatory === false ? "" : "selected"}>Mandatory</option>
      <option value="0" ${doc.mandatory === false ? "selected" : ""}>Optional</option>
    </select>
    <input class="notes" type="text" placeholder="Notes" value="${doc.notes || ""}">
    <button class="mini-btn" type="button">Remove</button>
  `;
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
    fetch("/api/meta/ministries", { headers: { Authorization: "Bearer " + token } }),
    fetch("/api/meta/categories", { headers: { Authorization: "Bearer " + token } }),
    fetch("/api/admin/overview", { headers: { Authorization: "Bearer " + token } }),
    fetch("/api/admin/schemes", { headers: { Authorization: "Bearer " + token } })
  ]);

  const ministries = await minRes.json();
  const categories = await catRes.json();
  const overview = await overRes.json();
  const schemes = await schemeRes.json();

  document.getElementById("ministry_id").innerHTML = ministries.map(m => `<option value="${m.id}">${m.ministry_name}</option>`).join("");
  document.getElementById("category_id").innerHTML = categories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join("");

  document.getElementById("adminStats").innerHTML = `
    <div class="stat"><div class="label">Users</div><div class="value">${overview.users}</div></div>
    <div class="stat"><div class="label">Schemes</div><div class="value">${overview.schemes}</div></div>
    <div class="stat"><div class="label">Profiles</div><div class="value">${overview.profiles}</div></div>
    <div class="stat"><div class="label">Notifications</div><div class="value">${overview.notifications}</div></div>
  `;

  const box = document.getElementById("schemes");
  box.innerHTML = schemes.map(s => `
    <div class="item">
      <div class="meta">
        <span class="chip">${s.category_name}</span>
        <span class="chip">${s.ministry_name}</span>
        <span class="chip ${s.is_active ? 'green' : 'red'}">${s.is_active ? 'Active' : 'Inactive'}</span>
      </div>
      <h3>${s.scheme_name}</h3>
      <p class="desc">${s.short_title || s.description || ""}</p>
      <div class="meta">
        <span class="chip">Code: ${s.scheme_code}</span>
        <span class="chip">Limit: ${s.income_limit || "N/A"}</span>
      </div>
    </div>
  `).join("") || `<p>No schemes yet.</p>`;
}

function refreshAdmin() {
  loadMeta();
}

async function submitScheme() {
  const msg = document.getElementById("msg");
  msg.textContent = "Publishing...";

  const rules = Array.from(document.querySelectorAll("#rules .rule-row")).map(row => ({
    field_name: row.querySelector(".field-name").value,
    operator_name: row.querySelector(".operator-name").value,
    value1: row.querySelector(".value1").value,
    value2: row.querySelector(".value2").value,
    mandatory: true,
    notes: ""
  }));

  const required_documents = Array.from(document.querySelectorAll("#docs .rule-row")).map(row => ({
    document_name: row.querySelector(".document-name").value,
    document_code: row.querySelector(".document-code").value,
    mandatory: row.querySelector(".mandatory").value === "1",
    notes: row.querySelector(".notes").value
  }));

  const body = {
    scheme_code: document.getElementById("scheme_code").value || `SCH-${Date.now()}`,
    scheme_name: document.getElementById("scheme_name").value,
    short_title: document.getElementById("short_title").value,
    description: document.getElementById("description").value,
    ministry_id: Number(document.getElementById("ministry_id").value),
    category_id: Number(document.getElementById("category_id").value),
    beneficiary_type: document.getElementById("beneficiary_type").value,
    target_audience: "",
    application_mode: document.getElementById("application_mode").value,
    benefit_type: document.getElementById("benefit_type").value,
    benefit_amount: document.getElementById("benefit_amount").value || null,
    income_limit: document.getElementById("income_limit").value || null,
    age_min: document.getElementById("age_min").value || null,
    age_max: document.getElementById("age_max").value || null,
    state_scope: document.getElementById("state_scope").value,
    launch_date: document.getElementById("launch_date").value || null,
    start_date: null,
    end_date: null,
    deadline: document.getElementById("deadline").value || null,
    official_website: document.getElementById("official_website").value,
    application_link: document.getElementById("application_link").value,
    documents_link: document.getElementById("documents_link").value,
    is_active: true,
    eligibility_rules: rules,
    required_documents
  };

  try {
    const res = await fetch("/api/admin/schemes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();

    msg.textContent = data.message || "Done";
    if (data.success) {
      setTimeout(() => refreshAdmin(), 700);
    }
  } catch (err) {
    msg.textContent = err.message;
  }
}

addRule();
addDocument();
loadMeta();
