// backend/auth.js
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const header = req.header("Authorization");

  if (!header) {
    return res.status(401).json({ msg: "No Token" });
  }

  // Remove 'Bearer ' prefix if present
  const token = header.startsWith("Bearer ")
    ? header.split(" ")[1]
    : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Save decoded user info in req.user
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ msg: "Invalid Token" });
  }
};

// Export protect middleware
module.exports = { protect };