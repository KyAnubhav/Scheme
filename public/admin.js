const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "/login.html";
if (role !== "admin") window.location.href = "/dashboard.html";

const FIELD_OPTIONS = [
  { key: "annual_family_income", label: "Annual family income", type: "number", operator: "<=" },
  { key: "state", label: "State", type: "text", operator: "=" },
  { key: "district", label: "District", type: "text", operator: "=" },
  { key: "category", label: "Category", type: "text", operator: "=" },
  { key: "gender", label: "Gender", type: "text", operator: "=" },
  { key: "marital_status", label: "Marital status", type: "text", operator: "=" },
  { key: "occupation", label: "Occupation", type: "text", operator: "=" },
  { key: "education_level", label: "Education level", type: "text", operator: "=" },
  { key: "is_student", label: "Student", type: "boolean", operator: "=" },
  { key: "is_farmer", label: "Farmer", type: "boolean", operator: "=" },
  { key: "land_holding_acres", label: "Land holding acres", type: "number", operator: "<=" },
  { key: "disability_percent", label: "Disability percent", type: "number", operator: ">=" },
  { key: "minority_status", label: "Minority status", type: "boolean", operator: "=" },
  { key: "women_headed_household", label: "Women-headed household", type: "boolean", operator: "=" },
  { key: "single_parent", label: "Single parent", type: "boolean", operator: "=" },
  { key: "currently_employed", label: "Currently employed", type: "boolean", operator: "=" },
  { key: "aadhaar_verified", label: "Aadhaar verified", type: "boolean", operator: "=" },
  { key: "bank_account_linked", label: "Bank account linked", type: "boolean", operator: "=" }
];

const BENEFICIARY_TYPES = [
  ["Individual", "Individual"],
  ["Household", "Household"],
  ["Student", "Student"],
  ["Farmer", "Farmer"],
  ["Women", "Women"],
  ["Persons with Disabilities", "Persons with Disabilities"],
  ["Senior Citizen", "Senior Citizen"],
  ["Institution", "Institution"]
];

const DEFAULT_MINISTRIES = [
  { id: 1, ministry_name: "Ministry of Education" },
  { id: 2, ministry_name: "Ministry of Rural Development" },
  { id: 3, ministry_name: "Ministry of Women and Child Development" },
  { id: 4, ministry_name: "Ministry of Social Justice and Empowerment" },
  { id: 5, ministry_name: "Ministry of Agriculture and Farmers Welfare" }
];

const DEFAULT_CATEGORIES = [
  { id: 1, category_name: "Scholarship" },
  { id: 2, category_name: "Women Support" },
  { id: 3, category_name: "Farmer Support" },
  { id: 4, category_name: "Disability Support" },
  { id: 5, category_name: "Livelihood" }
];

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function esc(str) {
  return String(str ?? "").replace(/[&<>"]/g, (m) => ({
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

function fieldMeta(key) {
  return FIELD_OPTIONS.find((f) => f.key === key) || FIELD_OPTIONS[0];
}

function ruleRow(rule = {}) {
  const meta = fieldMeta(rule.field_name || FIELD_OPTIONS[0].key);

  const row = document.createElement("div");
  row.className = "rule-row";
  row.dataset.field = meta.key;
  row.dataset.operator = meta.operator;

  const valueControl = meta.type === "boolean"
    ? `
      <select class="value compact">
        <option value="1">Yes</option>
        <option value="0">No</option>
      </select>
    `
    : meta.type === "number"
      ? `<input class="value compact" type="number" min="0" step="0.01" placeholder="Value" />`
      : `<input class="value compact" type="text" placeholder="Value" />`;

  row.innerHTML = `
    <div class="field">
      <label>Field</label>
      <select class="field-name compact">
        ${FIELD_OPTIONS.map((f) => `<option value="${esc(f.key)}">${esc(f.label)}</option>`).join("")}
      </select>
    </div>

    <div class="field">
      <label>Value</label>
      ${valueControl}
    </div>

    <button class="danger" type="button">Remove</button>
  `;

  const fieldSelect = row.querySelector(".field-name");
  fieldSelect.value = meta.key;
  const setValueUI = (fieldKey, value = "") => {
    const nextMeta = fieldMeta(fieldKey);
    row.dataset.field = nextMeta.key;
    row.dataset.operator = nextMeta.operator;

    const old = row.querySelector(".value");
    const newValue = document.createElement(nextMeta.type === "boolean" ? "select" : "input");
    newValue.className = "value compact";

    if (nextMeta.type === "boolean") {
      newValue.innerHTML = `<option value="1">Yes</option><option value="0">No</option>`;
      newValue.value = value === true || value === "1" ? "1" : value === false || value === "0" ? "0" : "1";
    } else {
      newValue.type = nextMeta.type === "number" ? "number" : "text";
      if (nextMeta.type === "number") {
        newValue.min = "0";
        newValue.step = "0.01";
      }
      newValue.placeholder = "Value";
      newValue.value = value ?? "";
    }

    old.replaceWith(newValue);
  };

  fieldSelect.addEventListener("change", (e) => setValueUI(e.target.value));

  setValueUI(meta.key, rule.value1 || "");

  row.querySelector("button").onclick = () => row.remove();
  return row;
}

function addRule() {
  document.getElementById("rules").appendChild(ruleRow());
}

function normalizeRule(row) {
  const field = row.dataset.field;
  const operator = row.dataset.operator;
  const valueEl = row.querySelector(".value");
  const meta = fieldMeta(field);

  let value1 = valueEl.value;

  if (meta.type === "boolean") {
    value1 = valueEl.value === "1" ? "1" : "0";
  } else if (meta.type === "number") {
    value1 = valueEl.value.trim();
  } else {
    value1 = valueEl.value.trim();
  }

  return {
    field_name: field,
    operator_name: operator,
    value1,
    value2: null,
    mandatory: true,
    notes: ""
  };
}

async function loadMeta() {
  const [minRes, catRes, overRes, schemeRes] = await Promise.allSettled([
    fetch("/api/meta/ministries", { headers: headers() }),
    fetch("/api/meta/categories", { headers: headers() }),
    fetch("/api/admin/overview", { headers: headers() }),
    fetch("/api/admin/schemes", { headers: headers() })
  ]);

  const ministries = minRes.status === "fulfilled" ? await minRes.value.json().catch(() => DEFAULT_MINISTRIES) : DEFAULT_MINISTRIES;
  const categories = catRes.status === "fulfilled" ? await catRes.value.json().catch(() => DEFAULT_CATEGORIES) : DEFAULT_CATEGORIES;
  const overview = overRes.status === "fulfilled" ? await overRes.value.json().catch(() => ({ users: 0, schemes: 0, profiles: 0, notifications: 0 })) : { users: 0, schemes: 0, profiles: 0, notifications: 0 };
  const schemes = schemeRes.status === "fulfilled" ? await schemeRes.value.json().catch(() => []) : [];

  const ministrySelect = document.getElementById("ministry_id");
  ministrySelect.innerHTML = (ministries.length ? ministries : DEFAULT_MINISTRIES)
    .map((m) => `<option value="${m.id}">${esc(m.ministry_name)}</option>`)
    .join("");

  const categorySelect = document.getElementById("category_id");
  categorySelect.innerHTML = (categories.length ? categories : DEFAULT_CATEGORIES)
    .map((c) => `<option value="${c.id}">${esc(c.category_name)}</option>`)
    .join("");

  const beneficiary = document.getElementById("beneficiary_type");
  beneficiary.innerHTML = BENEFICIARY_TYPES
    .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`)
    .join("");

  document.getElementById("adminStats").innerHTML = `
    <div class="stat"><div class="label">Users</div><div class="value">${overview.users || 0}</div></div>
    <div class="stat"><div class="label">Schemes</div><div class="value">${overview.schemes || 0}</div></div>
    <div class="stat"><div class="label">Profiles</div><div class="value">${overview.profiles || 0}</div></div>
    <div class="stat"><div class="label">Notifications</div><div class="value">${overview.notifications || 0}</div></div>
  `;

  document.getElementById("schemes").innerHTML = schemes.length
    ? schemes.map((s) => `
        <div class="scheme-card">
          <header>
            <div>
              <h3>${esc(s.scheme_name)}</h3>
              <div class="meta">${esc(s.short_title || "")}</div>
            </div>
            <button class="danger" type="button" onclick="deleteScheme(${s.id})">Delete</button>
          </header>
          <div class="meta">
            ${esc(s.category_name || "")} · ${esc(s.ministry_name || "")} · ${esc(s.state_scope || "National")}
          </div>
          <div class="badges">
            <span class="badge neutral">${esc(s.beneficiary_type || "Beneficiary")}</span>
            <span class="badge">${esc(s.benefit_type || "Benefit")}</span>
            ${s.income_limit ? `<span class="badge warn">Income up to ₹${esc(s.income_limit)}</span>` : ""}
          </div>
        </div>
      `).join("")
    : `<div class="notice">No schemes published yet.</div>`;
}

function refreshAdmin() {
  loadMeta();
}

async function submitScheme() {
  const msg = document.getElementById("msg");
  msg.textContent = "Publishing...";

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
    eligibility_rules: Array.from(document.querySelectorAll("#rules .rule-row")).map(normalizeRule),
    required_documents: []
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
      document.getElementById("scheme_code").value = "";
      document.getElementById("scheme_name").value = "";
      document.getElementById("short_title").value = "";
      document.getElementById("benefit_amount").value = "";
      document.getElementById("income_limit").value = "";
      document.getElementById("state_scope").value = "";
      document.getElementById("deadline").value = "";
      document.getElementById("official_website").value = "";
      document.getElementById("application_link").value = "";
      document.getElementById("documents_link").value = "";
      document.getElementById("description").value = "";
      document.getElementById("rules").innerHTML = "";
      addRule();
      await loadMeta();
    }
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function deleteScheme(id) {
  if (!confirm("Delete this published scheme?")) return;

  try {
    const res = await fetch(`/api/admin/schemes/${id}`, {
      method: "DELETE",
      headers: headers()
    });
    const data = await res.json();
    document.getElementById("msg").textContent = data.message || "Deleted";
    await loadMeta();
  } catch (err) {
    document.getElementById("msg").textContent = err.message;
  }
}

window.addRule = addRule;
window.submitScheme = submitScheme;
window.refreshAdmin = refreshAdmin;
window.logout = logout;
window.deleteScheme = deleteScheme;

addRule();
loadMeta();
