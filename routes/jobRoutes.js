const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");



// CREATE JOB (Recruiter Only)

router.post("/", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description,
      company: req.body.company,
      location: req.body.location,
      salary: req.body.salary,
      jobType: req.body.jobType || "Full-time",
      category: req.body.category || "Other",
      experience: req.body.experience,
      recruiter: req.user.id
    });

    res.status(201).json(job);

  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ msg: "Error creating job" });
  }
});



// GET ALL JOBS (Public with Search & Filter)
router.get("/", async (req, res) => {
  try {
    const { search, location, jobType, category, sort } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (category) {
      query.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "salary_high") sortOption = { salary: -1 };
    if (sort === "salary_low") sortOption = { salary: 1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const jobs = await Job.find(query).populate("recruiter", "name email").sort(sortOption);
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ msg: "Error fetching jobs" });
  }
});

// GET RECRUITER'S JOBS
router.get("/recruiter", protect, authorize("recruiter"), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).populate("recruiter", "name email");
    res.json(jobs);
  } catch (error) {
    console.error("Recruiter jobs error:", error);
    res.status(500).json({ msg: "Error fetching recruiter jobs" });
  }
});



// GET SINGLE JOB

router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("recruiter", "name email");

    if (!job) {
      return res.status(404).json({ msg: "Job not found" });
    }

    res.json(job);

  } catch (error) {
    res.status(500).json({ msg: "Error fetching job" });
  }
});



// UPDATE JOB (Only Owner Recruiter)
router.put("/:id", protect, authorize("recruiter"), async (req, res) => {
  try {
    const updatedJob = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user.id },
      {
        title: req.body.title,
        description: req.body.description,
        company: req.body.company,
        location: req.body.location,
        salary: req.body.salary,
        jobType: req.body.jobType,
        category: req.body.category,
        experience: req.body.experience,
      },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ msg: "Job not found or not authorized" });
    }

    res.json(updatedJob);

  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});
// DELETE JOB (Only Owner Recruiter)

router.delete("/:id", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: "Job not found" });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await job.deleteOne();

    res.json({ msg: "Job deleted successfully" });

  } catch (error) {
    res.status(500).json({ msg: "Error deleting job" });
  }
});




module.exports = router;