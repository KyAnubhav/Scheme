const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "login.html";
if (role !== "admin") window.location.href = "dashboard.html";

const FIELD_OPTIONS = [
  { key: "annual_family_income", label: "Annual family income", type: "number", operators: ["<=", ">=", "="] },
  { key: "disability_percent", label: "Disability percent", type: "number", operators: ["<=", ">=", "="] },
  { key: "land_holding_acres", label: "Land holding acres", type: "number", operators: ["<=", ">=", "="] },
  { key: "state", label: "State", type: "text", operators: ["="] },
  { key: "district", label: "District", type: "text", operators: ["="] },
  { key: "category", label: "Category", type: "text", operators: ["="] },
  { key: "gender", label: "Gender", type: "text", operators: ["="] },
  { key: "marital_status", label: "Marital status", type: "text", operators: ["="] },
  { key: "occupation", label: "Occupation", type: "text", operators: ["="] },
  { key: "education_level", label: "Education level", type: "text", operators: ["="] },
  { key: "is_student", label: "Student", type: "boolean", operators: ["="] },
  { key: "is_farmer", label: "Farmer", type: "boolean", operators: ["="] },
  { key: "minority_status", label: "Minority status", type: "boolean", operators: ["="] },
  { key: "women_headed_household", label: "Women-headed household", type: "boolean", operators: ["="] },
  { key: "single_parent", label: "Single parent", type: "boolean", operators: ["="] },
  { key: "currently_employed", label: "Currently employed", type: "boolean", operators: ["="] },
  { key: "aadhaar_verified", label: "Aadhaar verified", type: "boolean", operators: ["="] },
  { key: "bank_account_linked", label: "Bank account linked", type: "boolean", operators: ["="] }
];

const BENEFICIARY_TYPES = [
  "Individual",
  "Household",
  "Student",
  "Farmer",
  "Women",
  "Persons with Disabilities",
  "Senior Citizen",
  "Institution"
];

function headers() {
  return { Authorization: "Bearer " + token, "Content-Type": "application/json" };
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function fieldConfig(key) {
  return FIELD_OPTIONS.find(f => f.key === key) || FIELD_OPTIONS[0];
}

function operatorOptionsFor(field) {
  return fieldConfig(field).operators;
}

function ruleRow(rule = {}) {
  const row = document.createElement("div");
  row.className = "rule-row";

  const fieldKey = rule.field_name || FIELD_OPTIONS[0].key;
  const fieldOpts = FIELD_OPTIONS.map(f => `<option value="${f.key}" ${f.key === fieldKey ? "selected" : ""}>${f.label}</option>`).join("");
  const ops = operatorOptionsFor(fieldKey)
    .map(o => `<option value="${o}" ${o === (rule.operator_name || "=") ? "selected" : ""}>${o}</option>`)
    .join("");

  row.innerHTML = `
    <div class="rule-grid">
      <div>
        <label>Field</label>
        <select class="field-name">${fieldOpts}</select>
      </div>
      <div>
        <label>Operator</label>
        <select class="operator-name">${ops}</select>
      </div>
      <div>
        <label>Value</label>
        <input class="value1" type="text" value="${rule.value1 || ""}" placeholder="Enter value">
      </div>
      <div style="display:flex; align-items:end;">
        <button class="danger" type="button">Remove</button>
      </div>
    </div>
  `;

  const fieldSelect = row.querySelector(".field-name");
  const operatorSelect = row.querySelector(".operator-name");
  const valueInput = row.querySelector(".value1");

  function sync() {
    const cfg = fieldConfig(fieldSelect.value);
    operatorSelect.innerHTML = cfg.operators.map(o => `<option value="${o}">${o}</option>`).join("");
    if (!cfg.operators.includes(operatorSelect.value)) operatorSelect.value = cfg.operators[0];
    valueInput.type = cfg.type === "number" ? "number" : "text";
    valueInput.placeholder = cfg.type === "boolean" ? "Use Yes/No, 1/0" : "Enter value";
  }

  fieldSelect.addEventListener("change", sync);
  row.querySelector("button").onclick = () => row.remove();
  sync();
  return row;
}

function docRow(doc = {}) {
  const row = document.createElement("div");
  row.className = "doc-row";
  row.innerHTML = `
    <div class="doc-grid">
      <div>
        <label>Document name</label>
        <input class="document-name" type="text" value="${doc.document_name || ""}" placeholder="e.g. Aadhaar card">
      </div>
      <div>
        <label>Code</label>
        <input class="document-code" type="text" value="${doc.document_code || ""}" placeholder="e.g. ID01">
      </div>
      <div>
        <label>Status</label>
        <select class="mandatory">
          <option value="1" ${doc.mandatory !== false ? "selected" : ""}>Mandatory</option>
          <option value="0" ${doc.mandatory === false ? "selected" : ""}>Optional</option>
        </select>
      </div>
      <div>
        <label>Notes</label>
        <input class="notes" type="text" value="${doc.notes || ""}" placeholder="Optional notes">
      </div>
      <div style="display:flex; align-items:end;">
        <button class="danger" type="button">Remove</button>
      </div>
    </div>
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
    fetch("/api/meta/ministries", { headers: headers() }),
    fetch("/api/meta/categories", { headers: headers() }),
    fetch("/api/admin/overview", { headers: headers() }),
    fetch("/api/admin/schemes", { headers: headers() })
  ]);

  const ministries = await minRes.json();
  const categories = await catRes.json();
  const overview = await overRes.json();
  const schemes = await schemeRes.json();

  const ministrySelect = document.getElementById("ministry_id");
  const categorySelect = document.getElementById("category_id");
  const beneficiarySelect = document.getElementById("beneficiary_type");

  ministrySelect.innerHTML = `<option value="">Select ministry</option>` + ministries.map(m => `<option value="${m.id}">${m.ministry_name}</option>`).join("");
  categorySelect.innerHTML = `<option value="">Select category</option>` + categories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join("");
  beneficiarySelect.innerHTML = BENEFICIARY_TYPES.map(v => `<option value="${v}">${v}</option>`).join("");

  document.getElementById("statUsers").textContent = overview.users;
  document.getElementById("statSchemes").textContent = overview.schemes;
  document.getElementById("statNotifications").textContent = overview.notifications;

  const box = document.getElementById("schemes");
  box.innerHTML = schemes.length ? schemes.map(s => `
    <div class="scheme-card">
      <div class="meta">
        <span class="badge">${s.is_active ? "Active" : "Inactive"}</span>
        <span class="badge">${s.category_name || "Category"}</span>
        <span class="badge">${s.ministry_name || "Ministry"}</span>
      </div>
      <h5>${s.scheme_name}</h5>
      <div class="desc">${s.short_title || s.description || "No description provided."}</div>
      <div class="foot">
        <span>Code: ${s.scheme_code}</span>
        <span>Limit: ${s.income_limit ?? "N/A"}</span>
      </div>
    </div>
  `).join("") : `<div class="notice">No schemes published yet.</div>`;
}

function refreshAdmin() {
  loadMeta();
}

async function submitScheme() {
  const msg = document.getElementById("msg");
  msg.textContent = "Publishing scheme...";

  const rules = Array.from(document.querySelectorAll("#rules .rule-row")).map(row => ({
    field_name: row.querySelector(".field-name").value,
    operator_name: row.querySelector(".operator-name").value,
    value1: row.querySelector(".value1").value,
    mandatory: true,
    notes: ""
  }));

  const required_documents = Array.from(document.querySelectorAll("#docs .doc-row")).map(row => ({
    document_name: row.querySelector(".document-name").value,
    document_code: row.querySelector(".document-code").value,
    mandatory: row.querySelector(".mandatory").value === "1",
    notes: row.querySelector(".notes").value
  }));

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
    state_scope: document.getElementById("state_scope").value.trim(),
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

  if (!body.scheme_name || !body.description || !body.ministry_id || !body.category_id) {
    msg.textContent = "Fill scheme name, description, ministry, and category.";
    return;
  }

  try {
    const res = await fetch("/api/admin/schemes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      msg.textContent = data.message || "Could not publish scheme.";
      return;
    }

    msg.textContent = data.message || "Scheme published.";
    document.getElementById("scheme_code").value = "";
    document.getElementById("scheme_name").value = "";
    document.getElementById("short_title").value = "";
    document.getElementById("description").value = "";
    document.getElementById("benefit_amount").value = "";
    document.getElementById("income_limit").value = "";
    document.getElementById("state_scope").value = "";
    document.getElementById("deadline").value = "";
    document.getElementById("official_website").value = "";
    document.getElementById("application_link").value = "";
    document.getElementById("documents_link").value = "";
    document.getElementById("rules").innerHTML = "";
    document.getElementById("docs").innerHTML = "";
    addRule();
    addDocument();
    setTimeout(refreshAdmin, 800);
  } catch (err) {
    msg.textContent = err.message || "Could not publish scheme.";
  }
}

addRule();
addDocument();
loadMeta();
