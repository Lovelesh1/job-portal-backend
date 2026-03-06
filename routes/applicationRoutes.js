const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const upload = require("../middleware/upload");


// APPLY JOB (Jobseeker) with resume upload
router.post("/:jobId", protect, authorize("jobseeker"), upload.single("resume"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate("recruiter");
    if (!job) return res.status(404).json({ msg: "Job not found" });

    const existing = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.id
    });

    if (existing) {
      return res.status(400).json({ msg: "Already applied" });
    }

    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user.id,
      resume: req.file ? `/uploads/${req.file.filename}` : req.body.resume,
      coverLetter: req.body.coverLetter,
      status: "Pending"
    });

    // Create notification for recruiter
    await Notification.create({
      user: job.recruiter._id,
      title: "New Application",
      message: `New application received for ${job.title}`,
      type: "application",
      link: `/recruiter-dashboard/applications`
    });

    res.status(201).json(application);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


// GET MY APPLICATIONS (Jobseeker)
router.get("/my", protect, authorize("jobseeker"), async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.user.id
    }).populate("job");

    res.json(applications);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});


// GET ALL APPLICATIONS FOR RECRUITER
router.get("/recruiter", protect, authorize("recruiter"), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id });
    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({
      job: { $in: jobIds }
    })
      .populate("applicant", "name email phone profile")
      .populate("job", "title company");

    res.json(applications);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


// UPDATE STATUS (Recruiter)
router.put("/:id/status", protect, authorize("recruiter"), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate("job");

    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    application.status = req.body.status;
    await application.save();

    // Create notification for jobseeker
    await Notification.create({
      user: application.applicant,
      title: "Application Status Updated",
      message: `Your application for ${application.job.title} has been ${req.body.status}`,
      type: "status_change",
      link: `/my-applications`
    });

    res.json(application);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error updating status" });
  }
});


// DELETE APPLICATION (Jobseeker)
router.delete("/:id", protect, authorize("jobseeker"), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ msg: "Not found" });
    }

    if (application.applicant.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await application.deleteOne();
    res.json({ msg: "Application removed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;