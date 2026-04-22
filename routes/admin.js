const express = require("express");
const { sql, poolPromise } = require("../db");
const { auth, requireRole } = require("../middleware/auth");
const { isSchemeEligible } = require("../utils/eligibility");
const { sendSchemeAlert } = require("../utils/mailer");

const router = express.Router();

async function notifyEligibleUsers(schemeId) {
  const db = await poolPromise;

  const schemeResult = await db.request()
    .input("scheme_id", sql.Int, schemeId)
    .query(`
      SELECT s.*, m.ministry_name, c.category_name
      FROM Schemes s
      JOIN Ministries m ON s.ministry_id = m.id
      JOIN SchemeCategories c ON s.category_id = c.id
      WHERE s.id = @scheme_id
    `);

  const scheme = schemeResult.recordset[0];
  if (!scheme) return;

  const rulesResult = await db.request()
    .input("scheme_id", sql.Int, schemeId)
    .query("SELECT * FROM SchemeEligibilityRules WHERE scheme_id = @scheme_id");

  const usersResult = await db.request().query(`
    SELECT u.id, u.username, u.email, p.*
    FROM Users u
    INNER JOIN UserProfiles p ON p.user_id = u.id
    WHERE u.is_verified = 1
  `);

  for (const row of usersResult.recordset) {
    const eligible = isSchemeEligible(row, rulesResult.recordset);
    if (!eligible) continue;

    try {
      await sendSchemeAlert(row.email, row.username, scheme);

      await db.request()
        .input("user_id", sql.Int, row.id)
        .input("scheme_id", sql.Int, schemeId)
        .input("subject", sql.NVarChar(200), `New eligible scheme: ${scheme.scheme_name}`)
        .input("message_body", sql.NVarChar(sql.MAX), `You are eligible for ${scheme.scheme_name}`)
        .query(`
          INSERT INTO Notifications (user_id, scheme_id, notification_type, subject, message_body, status)
          VALUES (@user_id, @scheme_id, 'email', @subject, @message_body, 'sent')
        `);
    } catch (err) {
      await db.request()
        .input("user_id", sql.Int, row.id)
        .input("scheme_id", sql.Int, schemeId)
        .input("subject", sql.NVarChar(200), `New eligible scheme: ${scheme.scheme_name}`)
        .input("error_message", sql.NVarChar(500), err.message)
        .query(`
          INSERT INTO Notifications (user_id, scheme_id, notification_type, subject, message_body, status, error_message)
          VALUES (@user_id, @scheme_id, 'email', @subject, NULL, 'failed', @error_message)
        `);
    }
  }
}

router.get("/overview", auth, requireRole("admin"), async (req, res) => {
  try {
    const db = await poolPromise;
    const [users, schemes, profiles, notifications] = await Promise.all([
      db.request().query("SELECT COUNT(*) AS count FROM Users"),
      db.request().query("SELECT COUNT(*) AS count FROM Schemes"),
      db.request().query("SELECT COUNT(*) AS count FROM UserProfiles"),
      db.request().query("SELECT COUNT(*) AS count FROM Notifications"),
    ]);

    res.json({
      users: users.recordset[0].count,
      schemes: schemes.recordset[0].count,
      profiles: profiles.recordset[0].count,
      notifications: notifications.recordset[0].count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/schemes", auth, requireRole("admin"), async (req, res) => {
  try {
    const db = await poolPromise;
    const result = await db.request().query(`
      SELECT s.*, m.ministry_name, c.category_name
      FROM Schemes s
      JOIN Ministries m ON s.ministry_id = m.id
      JOIN SchemeCategories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/schemes", auth, requireRole("admin"), async (req, res) => {
  const db = await poolPromise;
  const {
    scheme_code,
    scheme_name,
    short_title,
    description,
    ministry_id,
    category_id,
    beneficiary_type,
    target_audience,
    application_mode,
    benefit_type,
    benefit_amount,
    income_limit,
    age_min,
    age_max,
    state_scope,
    launch_date,
    start_date,
    end_date,
    deadline,
    official_website,
    application_link,
    documents_link,
    is_active,
    eligibility_rules = [],
    required_documents = []
  } = req.body;

  const tx = new sql.Transaction(db);

  try {
    await tx.begin();

    const schemeResult = await new sql.Request(tx)
      .input("scheme_code", sql.VarChar(50), scheme_code)
      .input("scheme_name", sql.NVarChar(200), scheme_name)
      .input("short_title", sql.NVarChar(120), short_title || null)
      .input("description", sql.NVarChar(sql.MAX), description)
      .input("ministry_id", sql.Int, ministry_id)
      .input("category_id", sql.Int, category_id)
      .input("beneficiary_type", sql.VarChar(30), beneficiary_type)
      .input("target_audience", sql.NVarChar(200), target_audience || null)
      .input("application_mode", sql.VarChar(20), application_mode)
      .input("benefit_type", sql.VarChar(40), benefit_type)
      .input("benefit_amount", sql.Decimal(12, 2), benefit_amount || null)
      .input("income_limit", sql.Decimal(12, 2), income_limit || null)
      .input("age_min", sql.Int, age_min || null)
      .input("age_max", sql.Int, age_max || null)
      .input("state_scope", sql.NVarChar(80), state_scope || null)
      .input("launch_date", sql.Date, launch_date || null)
      .input("start_date", sql.Date, start_date || null)
      .input("end_date", sql.Date, end_date || null)
      .input("deadline", sql.Date, deadline || null)
      .input("official_website", sql.NVarChar(255), official_website || null)
      .input("application_link", sql.NVarChar(255), application_link || null)
      .input("documents_link", sql.NVarChar(255), documents_link || null)
      .input("is_active", sql.Bit, is_active ? 1 : 0)
      .input("created_by", sql.Int, req.user.id)
      .query(`
        INSERT INTO Schemes (
          scheme_code, scheme_name, short_title, description, ministry_id, category_id,
          beneficiary_type, target_audience, application_mode, benefit_type, benefit_amount,
          income_limit, age_min, age_max, state_scope, launch_date, start_date, end_date,
          deadline, official_website, application_link, documents_link, is_active, created_by
        )
        OUTPUT INSERTED.id
        VALUES (
          @scheme_code, @scheme_name, @short_title, @description, @ministry_id, @category_id,
          @beneficiary_type, @target_audience, @application_mode, @benefit_type, @benefit_amount,
          @income_limit, @age_min, @age_max, @state_scope, @launch_date, @start_date, @end_date,
          @deadline, @official_website, @application_link, @documents_link, @is_active, @created_by
        );
      `);

    const schemeId = schemeResult.recordset[0].id;

    for (const rule of eligibility_rules) {
      await new sql.Request(tx)
        .input("scheme_id", sql.Int, schemeId)
        .input("field_name", sql.NVarChar(100), rule.field_name)
        .input("operator_name", sql.VarChar(20), rule.operator_name)
        .input("value1", sql.NVarChar(255), rule.value1 || null)
        .input("value2", sql.NVarChar(255), rule.value2 || null)
        .input("mandatory", sql.Bit, rule.mandatory ? 1 : 0)
        .input("notes", sql.NVarChar(255), rule.notes || null)
        .query(`
          INSERT INTO SchemeEligibilityRules
          (scheme_id, field_name, operator_name, value1, value2, mandatory, notes)
          VALUES (@scheme_id, @field_name, @operator_name, @value1, @value2, @mandatory, @notes)
        `);
    }

    for (const doc of required_documents) {
      await new sql.Request(tx)
        .input("scheme_id", sql.Int, schemeId)
        .input("document_name", sql.NVarChar(150), doc.document_name)
        .input("document_code", sql.VarChar(50), doc.document_code || null)
        .input("mandatory", sql.Bit, doc.mandatory ? 1 : 0)
        .input("notes", sql.NVarChar(255), doc.notes || null)
        .query(`
          INSERT INTO SchemeRequiredDocuments
          (scheme_id, document_name, document_code, mandatory, notes)
          VALUES (@scheme_id, @document_name, @document_code, @mandatory, @notes)
        `);
    }

    await tx.commit();
    await notifyEligibleUsers(schemeId);

    res.json({ success: true, message: "Scheme added successfully", schemeId });
  } catch (err) {
    await tx.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
