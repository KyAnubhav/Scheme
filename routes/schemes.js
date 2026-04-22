const express = require("express");
const { sql, poolPromise } = require("../db");
const { auth } = require("../middleware/auth");
const { isSchemeEligible } = require("../utils/eligibility");

const router = express.Router();

router.get("/all", auth, async (req, res) => {
  try {
    const db = await poolPromise;
    const result = await db.request().query(`
      SELECT s.*, m.ministry_name, c.category_name
      FROM Schemes s
      JOIN Ministries m ON s.ministry_id = m.id
      JOIN SchemeCategories c ON s.category_id = c.id
      WHERE s.is_active = 1
      ORDER BY s.created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/matched", auth, async (req, res) => {
  try {
    const db = await poolPromise;

    const profileResult = await db.request()
      .input("id", sql.Int, req.user.id)
      .query("SELECT * FROM UserProfiles WHERE user_id = @id");

    if (profileResult.recordset.length === 0) {
      return res.json([]);
    }

    const profile = profileResult.recordset[0];

    const schemesResult = await db.request().query(`
      SELECT s.*, m.ministry_name, c.category_name
      FROM Schemes s
      JOIN Ministries m ON s.ministry_id = m.id
      JOIN SchemeCategories c ON s.category_id = c.id
      WHERE s.is_active = 1
      ORDER BY s.created_at DESC
    `);

    const rulesResult = await db.request().query(`
      SELECT * FROM SchemeEligibilityRules
    `);

    const matched = [];

    for (const scheme of schemesResult.recordset) {
      const rules = rulesResult.recordset.filter((r) => r.scheme_id === scheme.id);
      if (rules.length === 0) continue;
      if (isSchemeEligible(profile, rules)) matched.push(scheme);
    }

    await db.request()
      .input("user_id", sql.Int, req.user.id)
      .query("DELETE FROM UserSchemeMatches WHERE user_id = @user_id");

    for (const scheme of matched) {
      await db.request()
        .input("user_id", sql.Int, req.user.id)
        .input("scheme_id", sql.Int, scheme.id)
        .query(`
          INSERT INTO UserSchemeMatches (user_id, scheme_id, match_status, checked_at)
          VALUES (@user_id, @scheme_id, 'eligible', SYSDATETIME())
        `);
    }

    res.json(matched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
