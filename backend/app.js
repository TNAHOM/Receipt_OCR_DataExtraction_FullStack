const express = require("express");
const app = express();
require("dotenv").config();

const uploadRoute = require("./routes/upload.route");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Simple Express API");
});

app.use("/upload", uploadRoute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
