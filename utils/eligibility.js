function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toLower(v) {
  return String(v ?? "").trim().toLowerCase();
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

function getActualValue(profile, field) {
  if (field === "age") return calcAge(profile.dob);
  return profile[field];
}

function compare(actual, operatorName, value1, value2) {
  const op = String(operatorName || "").toUpperCase();

  if (actual === null || actual === undefined || actual === "") return false;

  if (op === "=") {
  const a = String(actual ?? "").trim().toLowerCase();
  const b = String(value1 ?? "").trim().toLowerCase();

  const boolVals = ["true", "false", "1", "0", "yes", "no", "y", "n"];

  // handle boolean comparison
  if (boolVals.includes(a) || boolVals.includes(b)) {
    const toBool = (v) =>
      ["true", "1", "yes", "y"].includes(String(v).toLowerCase());

    return toBool(a) === toBool(b);
  }

  return a === b;
}
  if (op === "!=") return toLower(actual) !== toLower(value1);

  if (op === "<" || op === "<=" || op === ">" || op === ">=") {
    const a = toNumber(actual);
    const b = toNumber(value1);
    if (a === null || b === null) return false;
    if (op === "<") return a < b;
    if (op === "<=") return a <= b;
    if (op === ">") return a > b;
    return a >= b;
  }

  if (op === "IN") {
    const list = String(value1 || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(toLower(actual));
  }

  if (op === "BETWEEN") {
    const a = toNumber(actual);
    const b1 = toNumber(value1);
    const b2 = toNumber(value2);
    if (a === null || b1 === null || b2 === null) return false;
    return a >= b1 && a <= b2;
  }

  if (op === "LIKE") {
    return toLower(actual).includes(toLower(value1));
  }

  return false;
}

function isSchemeEligible(profile, rules) {
  for (const rule of rules) {
    const actual = getActualValue(profile, rule.field_name);
    const ok = compare(actual, rule.operator_name, rule.value1, rule.value2);
    if (!ok && rule.mandatory) return false;
  }
  return true;
}

module.exports = { isSchemeEligible, calcAge };
