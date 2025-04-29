import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

// Kết nối MongoDB
try {
  await mongoose.connect(
    "mongodb+srv://tnemo65ldt:W3Lr6wXF4rDVwAvy@cluster0.q2urbst.mongodb.net/JobPortal",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("MongoDB connection error:", err);
  process.exit(1);
}

// Định nghĩa Schema
const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true },
  phoneNumber: String,
  password: String,
  role: String,
  profile: {
    bio: String,
    skills: [String],
    resume: String,
    profilePhoto: String,
  },
});

const companySchema = new mongoose.Schema({
  name: { type: String, unique: true },
  description: String,
  website: String,
  location: String,
  logo: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  requirements: String,
  salary: String,
  experienceLevel: String,
  location: String,
  jobType: String,
  position: Number,
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
});

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: String,
});

const User = mongoose.model("User", userSchema);
const Company = mongoose.model("Company", companySchema);
const Job = mongoose.model("Job", jobSchema);
const Application = mongoose.model("Application", applicationSchema);

async function seedDatabase() {
  try {
    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    console.log("Cleared existing data");

    // Tạo user
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        fullname: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phoneNumber: faker.phone.number(),
        password: await bcrypt.hash("password123", 10),
        role: i % 2 === 0 ? "student" : "recruiter",
        profile: {
          bio: faker.lorem.sentence(),
          skills: faker.helpers
            .shuffle(["JavaScript", "Python", "Java", "C++", "Node.js", "React"])
            .slice(0, 3),
          resume: faker.internet.url(),
          profilePhoto: faker.image.avatar(),
        },
      });
    }
    await User.insertMany(users);
    console.log("Created 100 users");

    const allUsers = await User.find();
    const recruiters = allUsers.filter((u) => u.role === "recruiter");
    const students = allUsers.filter((u) => u.role === "student");

    // Tạo company
    const companies = [];
    for (let i = 0; i < 100; i++) {
      const recruiter = faker.helpers.arrayElement(recruiters);
      companies.push({
        name: `${faker.company.name()} Inc.`,
        description: faker.company.catchPhrase(),
        website: faker.internet.url(),
        location: faker.location.city(),
        logo: faker.image.url(),
        userId: recruiter._id,
      });
    }
    await Company.insertMany(companies);
    console.log("Created 100 companies");
    const allCompanies = await Company.find();

    // Tạo job
    const jobs = [];
    for (let i = 0; i < 100; i++) {
      const recruiter = faker.helpers.arrayElement(recruiters);
      const company = faker.helpers.arrayElement(allCompanies);
      jobs.push({
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraph(),
        requirements: faker.lorem.sentences(2),
        salary: faker.finance.amount(500, 5000, 0, "$"),
        experienceLevel: faker.helpers.arrayElement(["Entry", "Mid", "Senior"]),
        location: faker.location.city(),
        jobType: faker.helpers.arrayElement([
          "Full-time",
          "Part-time",
          "Remote",
          "Contract",
        ]),
        position: faker.number.int({ min: 1, max: 10 }),
        company: company._id,
        created_by: recruiter._id,
        applications: [],
      });
    }
    await Job.insertMany(jobs);
    console.log("Created 100 jobs");
    const allJobs = await Job.find();

    // Tạo application
    const applications = [];
    for (let i = 0; i < 100; i++) {
      const student = faker.helpers.arrayElement(students);
      const job = faker.helpers.arrayElement(allJobs);
      applications.push({
        job: job._id,
        applicant: student._id,
        status: faker.helpers.arrayElement(["pending", "accepted", "rejected"]),
      });
    }
    await Application.insertMany(applications);
    console.log("Created 100 applications");

    // Gán application vào job
    const allApplications = await Application.find();
    for (const app of allApplications) {
      await Job.findByIdAndUpdate(app.job, {
        $push: { applications: app._id },
      });
    }
    console.log("Assigned applications to jobs");

    // Tạo tài khoản admin
    await User.create({
      fullname: "Admin",
      email: "admin@gmail.com",
      phoneNumber: "1234567890",
      password: await bcrypt.hash("admin123", 10),
      role: "recruiter",
      profile: {
        bio: "Admin account",
        skills: [],
        resume: "",
        profilePhoto: "",
      },
    });
    console.log("Created admin account: admin@gmail.com");

    console.log("✅ Dữ liệu đã được tạo thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi seed dữ liệu:", err);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

seedDatabase();