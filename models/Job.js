const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salary: String,
  jobType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Remote"], default: "Full-time" },
  category: { type: String, default: "Other" },
  skills: [String],
  experience: String,
  deadline: Date,
  status: { type: String, enum: ["active", "closed"], default: "active" },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);
