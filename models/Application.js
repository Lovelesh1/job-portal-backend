const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resume: String,
  coverLetter: String,
  status: { type: String, enum: ["Pending", "accepted", "rejected", "under_review"], default: "Pending" },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);
