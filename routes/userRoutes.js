const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// GET user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE user profile
router.put("/me", protect, async (req, res) => {
  try {
    const { name, phone, bio, skills, experience, education } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, "profile.bio": bio, "profile.skills": skills, "profile.experience": experience, "profile.education": education },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// UPLOAD resume
router.post("/upload-resume", protect, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }
    const resumePath = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { "profile.resume": resumePath });
    res.json({ resume: resumePath, msg: "Resume uploaded successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET profile (for profile page)
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const profile = {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      location: user.profile?.location || "",
      bio: user.profile?.bio || "",
      skills: user.profile?.skills || "",
      experience: user.profile?.experience || "",
      education: user.profile?.education || "",
      resume: user.profile?.resume || null
    };
    res.json(profile);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE profile (for profile page)
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, phone, location, bio, skills, experience, education } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name, 
        email, 
        phone, 
        "profile.location": location,
        "profile.bio": bio, 
        "profile.skills": skills, 
        "profile.experience": experience, 
        "profile.education": education 
      },
      { new: true }
    ).select("-password");
    res.json({ msg: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET applicant profile (for recruiters)
router.get("/applicants/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const profile = {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      location: user.profile?.location || "",
      bio: user.profile?.bio || "",
      skills: user.profile?.skills || "",
      experience: user.profile?.experience || "",
      education: user.profile?.education || "",
      resumeUrl: user.profile?.resume || null
    };
    res.json(profile);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Download applicant resume
router.get("/applicants/:id/resume", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profile?.resume) {
      return res.status(404).json({ msg: "Resume not found" });
    }
    const path = require('path');
    const fs = require('fs');
    const resumePath = path.join(__dirname, '..', user.profile.resume);
    
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ msg: "Resume file not found" });
    }
    
    res.download(resumePath, `${user.name}_resume.pdf`);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
