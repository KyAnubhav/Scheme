const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/api", authRoutes);

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});