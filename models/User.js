const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: String,
  role: {
    type: String,
    enum: ["jobseeker", "recruiter", "admin"],
    default: "jobseeker"
  },
  profile: {
    bio: String,
    skills: String,
    experience: String,
    education: String,
    location: String,
    resume: String,
    profilePicture: String
  },
  approved: { 
    type: Boolean, 
    default: function() {
      return this.role !== "recruiter";
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
