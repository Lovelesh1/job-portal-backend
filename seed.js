const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Error:", err));

const Job = require("./models/Job");

const sampleJobs = [
  {
    title: "Frontend Developer",
    description: "React.js developer needed",
    company: "Tech Corp",
    location: "Mumbai",
    salary: "5-8 LPA"
  },
  {
    title: "Backend Developer",
    description: "Node.js developer needed",
    company: "StartupXYZ",
    location: "Bangalore",
    salary: "6-10 LPA"
  }
];

const seedDB = async () => {
  await Job.deleteMany({});
  await Job.insertMany(sampleJobs);
  console.log("Database seeded!");
  process.exit();
};

seedDB();
