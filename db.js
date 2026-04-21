const sql = require("mssql");

const config = {
    user: "sa",
    password: "manmith123",
    server: "localhost",
    port: 1433,
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