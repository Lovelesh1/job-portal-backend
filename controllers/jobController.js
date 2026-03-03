const Job = require("../models/Job"); // ensure Job model exist

// Get all jobs for recruiter
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }); // user id from auth
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.title = req.body.title || job.title;
    job.company = req.body.company || job.company;
    job.description = req.body.description || job.description;

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
// Create Job
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      recruiter: req.user._id   // 👈 MOST IMPORTANT
    });

    res.status(201).json(job);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};