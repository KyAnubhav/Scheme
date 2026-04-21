const sql = require("mssql");

const config = {
  user: "sa",
  password: "dbms sql 1990",
  server: "localhost\\SQLEXPRESS",   
  database: "governmentScheme",
  options: {
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch(err => console.log("DB ERROR:", err));

module.exports = { pool };