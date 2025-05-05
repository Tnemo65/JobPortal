import mongoose from "mongoose";
import { Faker, vi, en } from "@faker-js/faker";
import bcrypt from "bcrypt";

// Khởi tạo faker với locale tiếng Việt và fallback sang tiếng Anh
const faker = new Faker({ locale: [vi, en] });

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

// Danh sách các tỉnh thành Việt Nam
const vietnamLocations = [
  "Hà Nội", "TP Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "Nha Trang", "Huế", "Quy Nhơn", "Vũng Tàu", "Đà Lạt",
  "Bình Dương", "Đồng Nai", "Long An", "Tiền Giang", "Kiên Giang"
];

// Danh sách kỹ năng phổ biến tại Việt Nam
const vietnamSkills = [
  "Lập trình Java", "Lập trình Python", "Lập trình PHP", "ReactJS", "NodeJS",
  "Kế toán", "Marketing", "Bán hàng", "Thiết kế đồ họa", "Quản trị nhân sự",
  "Phát triển ứng dụng di động", "Quản lý dự án", "Phân tích dữ liệu", "SEO"
];

// Danh sách công ty mẫu tại Việt Nam
const vietnamCompanies = [
  "FPT Software", "VNG Corporation", "Tiki Corporation", "VinAI",
  "Shopee Vietnam", "Lazada Vietnam", "Viettel Solutions", "TMA Solutions",
  "Axon Active Vietnam", "Grab Vietnam"
];

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
      const email = `${faker.person.firstName().toLowerCase()}.${faker.person.lastName().toLowerCase()}@gmail.com`;
      users.push({
        fullname: faker.person.fullName(),
        email: email.toLowerCase(),
        phoneNumber: `0${faker.phone.number('9########')}`,
        password: await bcrypt.hash("matkhau123", 10),
        role: i % 2 === 0 ? "student" : "recruiter",
        profile: {
          bio: faker.lorem.sentence(),
          skills: faker.helpers
            .shuffle(vietnamSkills)
            .slice(0, faker.number.int({ min: 2, max: 4 })),
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
        name: i < vietnamCompanies.length 
          ? vietnamCompanies[i] 
          : `${faker.company.name()} Việt Nam`,
        description: faker.company.catchPhrase(),
        website: faker.internet.url(),
        location: faker.helpers.arrayElement(vietnamLocations),
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
      const salary = faker.number.int({ min: 10000000, max: 50000000 });
      jobs.push({
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraph(),
        requirements: faker.lorem.sentences(2),
        salary: `${salary.toLocaleString('vi-VN')} VNĐ`,
        experienceLevel: faker.helpers.arrayElement(["Mới bắt đầu", "Trung cấp", "Cao cấp"]),
        location: faker.helpers.arrayElement(vietnamLocations),
        jobType: faker.helpers.arrayElement([
          "Toàn thời gian",
          "Bán thời gian",
          "Từ xa",
          "Hợp đồng",
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
        status: faker.helpers.arrayElement(["đang chờ", "được chấp nhận", "bị từ chối"]),
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

    // Tạo tài khoản admin và người dùng
    await User.create([
      {
        fullname: "Quản trị viên",
        email: "admin@gmail.com",
        phoneNumber: "0987654321",
        password: await bcrypt.hash("123456", 10),
        role: "recruiter",
        profile: {
          bio: "Tài khoản quản trị viên",
          skills: [],
          resume: "",
          profilePhoto: "",
        },
      },
      {
        fullname: "Thịnh",
        email: "ldt@gmail.com",
        phoneNumber: "0987654321",
        password: await bcrypt.hash("123456", 10),
        role: "student",
        profile: {
          bio: "Tài khoản người dùng",
          skills: [],
          resume: "",
          profilePhoto: "",
        },
      }
    ]);
    console.log("Created accounts: admin@gmail.com and ldt@gmail.com");

    console.log("✅ Dữ liệu đã được tạo thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi seed dữ liệu:", err);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

seedDatabase();