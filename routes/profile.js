const express = require("express");
const { sql, poolPromise } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const db = await poolPromise;

    const userResult = await db.request()
      .input("id", sql.Int, req.user.id)
      .query("SELECT id, username, email, phone, role, is_verified FROM Users WHERE id = @id");

    const profileResult = await db.request()
      .input("id", sql.Int, req.user.id)
      .query("SELECT * FROM UserProfiles WHERE user_id = @id");

    res.json({
      user: userResult.recordset[0] || null,
      profile: profileResult.recordset[0] || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/me", auth, async (req, res) => {
  try {
    const db = await poolPromise;
    const p = req.body;

    await db.request()
      .input("user_id", sql.Int, req.user.id)
      .input("dob", sql.Date, p.dob || null)
      .input("gender", sql.VarChar(20), p.gender || null)
      .input("marital_status", sql.VarChar(20), p.marital_status || null)
      .input("category", sql.VarChar(30), p.category || null)
      .input("state", sql.NVarChar(80), p.state || null)
      .input("district", sql.NVarChar(80), p.district || null)
      .input("pincode", sql.VarChar(10), p.pincode || null)
      .input("annual_family_income", sql.Decimal(12, 2), p.annual_family_income || null)
      .input("occupation", sql.NVarChar(100), p.occupation || null)
      .input("education_level", sql.NVarChar(100), p.education_level || null)
      .input("institution_name", sql.NVarChar(150), p.institution_name || null)
      .input("course_name", sql.NVarChar(150), p.course_name || null)
      .input("is_student", sql.Bit, p.is_student ? 1 : 0)
      .input("is_farmer", sql.Bit, p.is_farmer ? 1 : 0)
      .input("land_holding_acres", sql.Decimal(6, 2), p.land_holding_acres || null)
      .input("disability_percent", sql.Int, p.disability_percent || null)
      .input("minority_status", sql.Bit, p.minority_status ? 1 : 0)
      .input("women_headed_household", sql.Bit, p.women_headed_household ? 1 : 0)
      .input("single_parent", sql.Bit, p.single_parent ? 1 : 0)
      .input("currently_employed", sql.Bit, p.currently_employed ? 1 : 0)
      .input("aadhaar_verified", sql.Bit, p.aadhaar_verified ? 1 : 0)
      .input("bank_account_linked", sql.Bit, p.bank_account_linked ? 1 : 0)
      .query(`
        MERGE UserProfiles AS target
        USING (SELECT @user_id AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET
            dob = @dob,
            gender = @gender,
            marital_status = @marital_status,
            category = @category,
            state = @state,
            district = @district,
            pincode = @pincode,
            annual_family_income = @annual_family_income,
            occupation = @occupation,
            education_level = @education_level,
            institution_name = @institution_name,
            course_name = @course_name,
            is_student = @is_student,
            is_farmer = @is_farmer,
            land_holding_acres = @land_holding_acres,
            disability_percent = @disability_percent,
            minority_status = @minority_status,
            women_headed_household = @women_headed_household,
            single_parent = @single_parent,
            currently_employed = @currently_employed,
            aadhaar_verified = @aadhaar_verified,
            bank_account_linked = @bank_account_linked,
            updated_at = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (
            user_id, dob, gender, marital_status, category, state, district, pincode,
            annual_family_income, occupation, education_level, institution_name, course_name,
            is_student, is_farmer, land_holding_acres, disability_percent, minority_status,
            women_headed_household, single_parent, currently_employed, aadhaar_verified, bank_account_linked
          )
          VALUES (
            @user_id, @dob, @gender, @marital_status, @category, @state, @district, @pincode,
            @annual_family_income, @occupation, @education_level, @institution_name, @course_name,
            @is_student, @is_farmer, @land_holding_acres, @disability_percent, @minority_status,
            @women_headed_household, @single_parent, @currently_employed, @aadhaar_verified, @bank_account_linked
          );
      `);

    res.json({ success: true, message: "Profile saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
