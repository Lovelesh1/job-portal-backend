const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Error:", err));

const Job = require("./models/Job");
const User = require("./models/User");

const sampleJobs = [
  {
    title: "Frontend Developer",
    description: "React.js developer with 2+ years experience",
    company: "Tech Solutions Inc",
    location: "Mumbai",
    salary: "5-8 LPA",
    jobType: "Full-time"
  },
  {
    title: "Backend Developer",
    description: "Node.js and MongoDB expert needed",
    company: "StartupXYZ",
    location: "Bangalore",
    salary: "6-10 LPA",
    jobType: "Full-time"
  },
  {
    title: "Full Stack Developer",
    description: "MERN stack developer required",
    company: "Digital Innovations",
    location: "Pune",
    salary: "8-12 LPA",
    jobType: "Full-time"
  }
];

const seedDB = async () => {
  try {
    const recruiter = await User.findOne({ role: "recruiter" });
    
    if (recruiter) {
      sampleJobs.forEach(job => job.recruiter = recruiter._id);
    }

    await Job.deleteMany({});
    await Job.insertMany(sampleJobs);
    console.log("Jobs added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedDB();
