require("dotenv").config();
const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "127.0.0.1",
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || "governmentScheme",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config).connect();

poolPromise
  .then(() => console.log("Connected to SQL Server"))
  .catch((err) => console.log("DB ERROR:", err));

module.exports = { sql, poolPromise };
