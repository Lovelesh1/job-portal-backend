const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// Simple test route (no auth required for testing)
router.get("/ping", (req, res) => {
  console.log("Admin ping route accessed");
  res.json({ message: "Admin routes are working", timestamp: new Date() });
});

// ADMIN MIDDLEWARE - Check if user is admin
const adminOnly = (req, res, next) => {
  console.log("Admin check - User role:", req.user?.role);
  if (req.user.role !== "admin") {
    console.log("Access denied - not admin");
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  console.log("Admin access granted");
  next();
};

// Test route for admin connectivity
router.get("/test", protect, adminOnly, async (req, res) => {
  try {
    console.log("Admin test route accessed successfully");
    res.json({ message: "Admin routes working", user: req.user });
  } catch (err) {
    console.error("Admin test route error:", err);
    res.status(500).json({ message: "Test route error" });
  }
});

// DASHBOARD STATS
router.get("/dashboard/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const jobseekers = await User.countDocuments({ role: "jobseeker" });
    const recruiters = await User.countDocuments({ role: "recruiter" });
    const pendingRecruiters = await User.countDocuments({ role: "recruiter", approved: false });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: "active" });
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: "Pending" });

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentJobs = await Job.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      totalUsers,
      jobseekers,
      recruiters,
      pendingRecruiters,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentUsers,
      recentJobs
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// GET ALL USERS WITH FILTERS
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// GET PENDING RECRUITERS
router.get("/recruiters/pending", protect, adminOnly, async (req, res) => {
  try {
    console.log("Fetching pending recruiters...");
    const pendingRecruiters = await User.find({ role: "recruiter", approved: false })
      .select("-password")
      .sort({ createdAt: -1 });
    console.log(`Found ${pendingRecruiters.length} pending recruiters`);
    res.json(pendingRecruiters);
  } catch (err) {
    console.error("Error fetching pending recruiters:", err);
    res.status(500).json({ message: "Error fetching pending recruiters" });
  }
});

// APPROVE RECRUITER
router.put("/recruiters/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).select("-password");
    
    if (!user) return res.status(404).json({ message: "Recruiter not found" });
    res.json({ message: "Recruiter approved", user });
  } catch (err) {
    res.status(500).json({ message: "Error approving recruiter" });
  }
});

// REJECT/DELETE USER
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
});

// GET ALL JOBS
router.get("/jobs", protect, adminOnly, async (req, res) => {
  try {
    console.log("Fetching all jobs for admin...");
    const jobs = await Job.find()
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });
    console.log(`Found ${jobs.length} jobs`);
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// DELETE JOB
router.delete("/jobs/:id", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting job" });
  }
});

// GET ANALYTICS DATA
router.get("/analytics", protect, adminOnly, async (req, res) => {
  try {
    // Job types distribution
    const jobTypes = await Job.aggregate([
      { $group: { _id: "$jobType", count: { $sum: 1 } } }
    ]);

    // Applications by status
    const applicationStats = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Top companies by jobs
    const topCompanies = await Job.aggregate([
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({ jobTypes, applicationStats, topCompanies });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

module.exports = router;
