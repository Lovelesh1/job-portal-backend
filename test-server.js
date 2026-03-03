const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Test server running" });
});

app.post("/api/auth/login", (req, res) => {
  res.json({ 
    token: "test-token",
    user: { role: "jobseeker", name: "Test User" }
  });
});

app.listen(5000, () => console.log("Test server on port 5000"));