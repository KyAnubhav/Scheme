const express = require("express");
const { sql, poolPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/ministries", auth, async (req, res) => {
  try {
    const db = await poolPromise;
    const result = await db.request().query(`
      SELECT id, ministry_name, short_code, description
      FROM Ministries
      WHERE active = 1
      ORDER BY ministry_name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/categories", auth, async (req, res) => {
  try {
    const db = await poolPromise;
    const result = await db.request().query(`
      SELECT id, category_name, slug, description
      FROM SchemeCategories
      WHERE active = 1
      ORDER BY category_name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
