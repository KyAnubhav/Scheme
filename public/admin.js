const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token) window.location.href = "/login.html";
if (role !== "admin") window.location.href = "/dashboard.html";

const BENEFICIARY_TYPES = [
  ["individual", "Individual"],
  ["household", "Household"],
  ["student", "Student"],
  ["farmer", "Farmer"],
  ["women", "Women"],
  ["persons_with_disabilities", "Persons with disabilities"],
  ["senior_citizen", "Senior citizen"],
  ["institution", "Institution"]
];

const FIELD_OPTIONS = [
  { key: "annual_family_income", label: "Annual family income", type: "number", operator: "<=", placeholder: "Enter income limit" },
  { key: "disability_percent", label: "Disability percent", type: "number", operator: "<=", placeholder: "Enter max percentage" },
  { key: "land_holding_acres", label: "Land holding acres", type: "number", operator: "<=", placeholder: "Enter max acres" },
  { key: "state", label: "State", type: "text", operator: "=", placeholder: "Enter state" },
  { key: "district", label: "District", type: "text", operator: "=", placeholder: "Enter district" },
  { key: "category", label: "Category", type: "text", operator: "=", placeholder: "General / OBC / SC / ST / EWS" },
  { key: "gender", label: "Gender", type: "text", operator: "=", placeholder: "Male / Female / Other" },
  { key: "marital_status", label: "Marital status", type: "text", operator: "=", placeholder: "Single / Married / ..." },
  { key: "is_student", label: "Student", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "is_farmer", label: "Farmer", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "minority_status", label: "Minority status", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "women_headed_household", label: "Women-headed household", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "single_parent", label: "Single parent", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "currently_employed", label: "Currently employed", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "aadhaar_verified", label: "Aadhaar verified", type: "boolean", operator: "=", placeholder: "Yes / No" },
  { key: "bank_account_linked", label: "Bank account linked", type: "boolean", operator: "=", placeholder: "Yes / No" }
];

function headers() {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
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

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function setMsg(text, kind = "") {
  const msg = document.getElementById("msg");
  msg.style.display = "block";
  msg.className = `notice ${kind}`.trim();
  msg.textContent = text;
}

function getFieldMeta(fieldKey) {
  return FIELD_OPTIONS.find((f) => f.key === fieldKey) || FIELD_OPTIONS[0];
}

function ruleRow(rule = {}) {
  const meta = getFieldMeta(rule.field_name || FIELD_OPTIONS[0].key);
  const row = document.createElement("div");
  row.className = "rule-row";
  row.dataset.kind = "rule";
  row.innerHTML = `
    <div>
      <div class="mini-label">Field</div>
      <select class="field-name"></select>
    </div>
    <div>
      <div class="mini-label">Condition</div>
      <div class="readonly-pill operator-label"></div>
    </div>
    <div>
      <div class="mini-label">Value</div>
      <input class="value1" />
    </div>
    <button type="button" class="btn btn-danger btn-small remove-link">Remove</button>
  `;

  const fieldSelect = row.querySelector(".field-name");
  fieldSelect.innerHTML = FIELD_OPTIONS.map((f) => `<option value="${f.key}">${escapeHtml(f.label)}</option>`).join("");
  fieldSelect.value = rule.field_name || meta.key;

  const refreshInput = () => {
    const current = getFieldMeta(fieldSelect.value);
    const value1 = row.querySelector(".value1");
    value1.type = current.type === "number" ? "number" : "text";
    value1.placeholder = current.placeholder;
    row.querySelector(".operator-label").textContent = current.operator;
  };

  fieldSelect.addEventListener("change", refreshInput);
  refreshInput();
  row.querySelector(".value1").value = rule.value1 || "";
  row.querySelector(".remove-link").onclick = () => row.remove();
  return row;
}

function docRow(doc = {}) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.dataset.kind = "doc";
  row.innerHTML = `
    <div>
      <div class="mini-label">Document</div>
      <input class="document-name" placeholder="Aadhaar card" />
    </div>
    <div>
      <div class="mini-label">Code</div>
      <input class="document-code" placeholder="AADHAAR" />
    </div>
    <div>
      <div class="mini-label">Status</div>
      <select class="mandatory">
        <option value="1">Mandatory</option>
        <option value="0">Optional</option>
      </select>
    </div>
    <div>
      <div class="mini-label">Notes</div>
      <input class="notes" placeholder="Short note" />
    </div>
    <button type="button" class="btn btn-danger btn-small remove-link">Remove</button>
  `;

  row.querySelector(".document-name").value = doc.document_name || "";
  row.querySelector(".document-code").value = doc.document_code || "";
  row.querySelector(".mandatory").value = doc.mandatory === false ? "0" : "1";
  row.querySelector(".notes").value = doc.notes || "";
  row.querySelector(".remove-link").onclick = () => row.remove();
  return row;
}

function addRule() {
  document.getElementById("rules").appendChild(ruleRow());
}

function addDocument() {
  document.getElementById("docs").appendChild(docRow());
}

function resetForm() {
  ["scheme_code","scheme_name","short_title","description","benefit_amount","income_limit","state_scope","deadline","official_website","application_link","documents_link"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("application_mode").value = "online";
  document.getElementById("benefit_type").value = "financial";
  document.getElementById("beneficiary_type").selectedIndex = 0;
  document.getElementById("rules").innerHTML = "";
  document.getElementById("docs").innerHTML = "";
  addRule();
  addDocument();
  setMsg("Form cleared.", "ok");
}

async function loadMeta() {
  try {
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

    document.getElementById("ministry_id").innerHTML = ministries.map((m) => `<option value="${m.id}">${escapeHtml(m.ministry_name)}</option>`).join("");
    document.getElementById("category_id").innerHTML = categories.map((c) => `<option value="${c.id}">${escapeHtml(c.category_name)}</option>`).join("");
    document.getElementById("beneficiary_type").innerHTML = BENEFICIARY_TYPES.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");

    document.getElementById("adminStats").innerHTML = [
      ["Users", overview.users],
      ["Profiles", overview.profiles],
      ["Schemes", overview.schemes]
    ].map(([label, value]) => `
      <div class="kpi card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>
    `).join("");

    const box = document.getElementById("schemes");
    box.innerHTML = schemes.length ? schemes.map((s) => `
      <article class="scheme-card">
        <div class="section-title" style="margin:0;align-items:flex-start;">
          <div>
            <h4>${escapeHtml(s.scheme_name)}</h4>
            <div class="meta">
              <span class="badge gray">${escapeHtml(s.category_name)}</span>
              <span class="badge gray">${escapeHtml(s.ministry_name)}</span>
              <span class="badge ${s.is_active ? 'green' : 'gray'}">${s.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <button type="button" class="btn btn-danger btn-small" onclick="deleteScheme(${s.id})">Remove</button>
        </div>
        <p>${escapeHtml(s.short_title || s.description || '')}</p>
        <div class="meta">
          <span>Code: ${escapeHtml(s.scheme_code)}</span>
          <span>Beneficiary: ${escapeHtml(s.beneficiary_type || '—')}</span>
          <span>Income limit: ${s.income_limit ? `₹${escapeHtml(s.income_limit)}` : '—'}</span>
        </div>
      </article>
    `).join("") : `<div class="empty">No schemes published yet.</div>`;
  } catch (err) {
    setMsg(err.message, "error");
  }
}

async function deleteScheme(id) {
  if (!confirm("Remove this published scheme?")) return;
  try {
    const res = await fetch(`/api/admin/schemes/${id}`, {
      method: "DELETE",
      headers: headers()
    });
    const data = await res.json();
    if (!data.success) {
      setMsg(data.message || "Could not remove scheme.", "error");
      return;
    }
    setMsg("Scheme removed.", "ok");
    await loadMeta();
  } catch (err) {
    setMsg(err.message, "error");
  }
}

async function submitScheme() {
  const scheme_name = document.getElementById("scheme_name").value.trim();
  const description = document.getElementById("description").value.trim();
  const msg = document.getElementById("msg");

  if (!scheme_name || !description) {
    setMsg("Scheme name and description are required.", "warn");
    return;
  }

  const rules = Array.from(document.querySelectorAll("#rules .rule-row")).map((row) => {
    const field = row.querySelector(".field-name").value;
    const meta = getFieldMeta(field);
    const value = row.querySelector(".value1").value.trim();

    return {
      field_name: field,
      operator_name: meta.operator,
      value1: value,
      value2: null,
      mandatory: true,
      notes: ""
    };
  }).filter((r) => r.value1 !== "");

  const required_documents = Array.from(document.querySelectorAll("#docs .rule-row")).map((row) => ({
    document_name: row.querySelector(".document-name").value.trim(),
    document_code: row.querySelector(".document-code").value.trim(),
    mandatory: row.querySelector(".mandatory").value === "1",
    notes: row.querySelector(".notes").value.trim()
  })).filter((d) => d.document_name);

  const body = {
    scheme_code: document.getElementById("scheme_code").value.trim() || `SCH-${Date.now()}`,
    scheme_name,
    short_title: document.getElementById("short_title").value.trim(),
    description,
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

  try {
    msg.style.display = "block";
    msg.className = "notice";
    msg.textContent = "Publishing...";

    const res = await fetch("/api/admin/schemes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) {
      setMsg(data.message || "Could not publish scheme.", "error");
      return;
    }

    setMsg("Scheme published.", "ok");
    resetForm();
    await loadMeta();
  } catch (err) {
    setMsg(err.message, "error");
  }
}

addRule();
addDocument();
loadMeta();
