
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL, "https://job-portal-client-3pjs.onrender.com"] 
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err=> console.log("MongoDB Error:", err));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Job Portal API is running" });
});

try {
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/jobs", require("./routes/jobRoutes"));
  app.use("/api/applications", require("./routes/applicationRoutes"));
  
  // Debug admin routes loading
  console.log("Loading admin routes...");
  const adminRoutes = require("./routes/adminRoutes");
  app.use("/api/admin", adminRoutes);
  console.log("Admin routes loaded successfully");
  
  app.use("/api/users", require("./routes/userRoutes"));
  app.use("/api", require("./routes/userRoutes")); // For /api/profile routes
  app.use("/api/notifications", require("./routes/notificationRoutes"));
  app.use("/api/chats", require("./routes/chatRoutes"));
  console.log("All routes loaded successfully");
} catch (err) {
  console.error("Route loading error:", err);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('=== ERROR DETAILS ===');
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Body:', req.body);
  console.error('Error:', err.stack);
  console.error('=====================');
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    url: req.url
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
