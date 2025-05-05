import mongoose from "mongoose";
import { Faker, vi, en } from "@faker-js/faker";
import bcrypt from "bcrypt";

// Khởi tạo faker với locale tiếng Việt và fallback sang tiếng Anh
const faker = new Faker({ locale: [vi, en] });

// Kết nối MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://tnemo65ldt:W3Lr6wXF4rDVwAvy@cluster0.q2urbst.mongodb.net/JobPortal"
    );
    console.log("Đã kết nối với MongoDB");
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1);
  }
}

// Định nghĩa Schema
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], required: true },
  profile: {
    bio: { type: String },
    skills: [{ type: String }],
    resume: {
      url: { type: String },
      title: { type: String },
      originalName: { type: String },
    },
    resumeOriginalName: { type: String },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    profilePhoto: { type: String, default: "" },
    githubUsername: { type: String },
    linkedinUsername: { type: String },
    facebookUsername: { type: String },
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  website: { type: String },
  location: { type: String },
  logo: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  salary: { type: Number, required: true },
  experienceLevel: { type: String, required: true },
  location: { type: String, required: true },
  jobType: { type: String, required: true },
  position: { type: Number, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  meta: { type: Object, default: {} },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Company = mongoose.model("Company", companySchema);
const Job = mongoose.model("Job", jobSchema);
const Application = mongoose.model("Application", applicationSchema);
const Notification = mongoose.model("Notification", notificationSchema);

// Danh sách các tỉnh thành Việt Nam
const vietnamLocations = [
  "Hà Nội", "TP Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "Nha Trang", "Huế", "Quy Nhơn", "Vũng Tàu", "Đà Lạt",
  "Bình Dương", "Đồng Nai", "Long An", "Tiền Giang", "Kiên Giang",
];

// Danh sách kỹ năng phổ biến tại Việt Nam
const vietnamSkills = [
  "Lập trình Java", "Lập trình Python", "Lập trình PHP", "ReactJS", "NodeJS",
  "Kế toán", "Marketing", "Bán hàng", "Thiết kế đồ họa", "Quản trị nhân sự",
  "Phát triển ứng dụng di động", "Quản lý dự án", "Phân tích dữ liệu", "SEO",
];

// Danh sách công ty mẫu tại Việt Nam
const vietnamCompanies = [
  "FPT Software", "VNG Corporation", "Tiki Corporation", "VinAI",
  "Shopee Vietnam", "Lazada Vietnam", "Viettel Solutions", "TMA Solutions",
  "Axon Active Vietnam", "Grab Vietnam",
];

// Danh sách tiêu đề công việc mẫu
const sampleJobTitles = [
  "Lập trình viên Full Stack",
  "Chuyên viên Marketing",
  "Kế toán viên",
  "Nhà thiết kế UI/UX",
  "Quản lý dự án CNTT",
  "Kỹ sư DevOps",
  "Chuyên gia phân tích dữ liệu",
  "Nhân viên bán hàng",
  "Chuyên viên nhân sự",
  "Lập trình viên ứng dụng di động",
];

async function seedDatabase() {
  await connectDB();

  try {
    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
    console.log("Đã xóa dữ liệu cũ");

    // Tạo user
    const users = [];
    for (let i = 0; i < 100; i++) {
      const email = `${faker.person.firstName().toLowerCase()}.${faker.person.lastName().toLowerCase()}${i}@gmail.com`;
      users.push({
        fullname: faker.person.fullName(),
        email: email.toLowerCase(),
        phoneNumber: `0${faker.phone.number("9########")}`,
        password: await bcrypt.hash("matkhau123", 10),
        role: i % 2 === 0 ? "user" : "admin",
        profile: {
          bio: faker.lorem.sentence(),
          skills: faker.helpers
            .shuffle(vietnamSkills)
            .slice(0, faker.number.int({ min: 2, max: 4 })),
          resume: {
            url: faker.internet.url(),
            title: `CV_${faker.person.fullName()}.pdf`,
            originalName: `CV_${faker.person.fullName()}.pdf`,
          },
          resumeOriginalName: `CV_${faker.person.fullName()}.pdf`,
          profilePhoto: faker.image.avatar(),
          githubUsername: faker.internet.userName(),
          linkedinUsername: faker.internet.userName(),
          facebookUsername: faker.internet.userName(),
        },
        savedJobs: [],
        appliedJobs: [],
      });
    }
    await User.insertMany(users);
    console.log("Đã tạo 100 người dùng");

    const allUsers = await User.find();
    const admins = allUsers.filter((u) => u.role === "admin");
    const candidates = allUsers.filter((u) => u.role === "user");

    // Tạo company
    const companies = [];
    for (let i = 0; i < 100; i++) {
      const admin = faker.helpers.arrayElement(admins);
      companies.push({
        name: i < vietnamCompanies.length
          ? vietnamCompanies[i]
          : `${faker.company.name()} Việt Nam ${i}`,
        description: faker.company.catchPhrase(),
        website: faker.internet.url(),
        location: faker.helpers.arrayElement(vietnamLocations),
        logo: faker.image.url(),
        userId: admin._id,
      });
    }
    await Company.insertMany(companies);
    console.log("Đã tạo 100 công ty");
    const allCompanies = await Company.find();

    // Tạo job (bao gồm mẫu công việc)
    const jobs = [];
    for (let i = 0; i < 100; i++) {
      const admin = faker.helpers.arrayElement(admins);
      const company = faker.helpers.arrayElement(allCompanies);
      const salary = faker.number.int({ min: 10000000, max: 50000000 });
      jobs.push({
        title: i < sampleJobTitles.length
          ? sampleJobTitles[i]
          : faker.person.jobTitle(),
        description: faker.lorem.paragraph(),
        requirements: faker.lorem.sentences(2).split(". ").filter((s) => s),
        salary,
        experienceLevel: faker.helpers.arrayElement(["Mới bắt đầu", "Trung cấp", "Cao cấp"]),
        location: faker.helpers.arrayElement(vietnamLocations),
        jobType: faker.helpers.arrayElement(["Toàn thời gian", "Bán thời gian", "Từ xa", "Hợp đồng"]),
        position: faker.number.int({ min: 1, max: 10 }),
        company: company._id,
        created_by: admin._id,
        applications: [],
      });
    }
    // Thêm một công việc mẫu cụ thể
    jobs.push({
      title: "Lập trình viên Backend",
      description: "Phát triển và duy trì các API cho hệ thống thương mại điện tử.",
      requirements: [
        "Kinh nghiệm với Node.js và MongoDB",
        "Hiểu biết về RESTful API",
        "Kỹ năng giải quyết vấn đề tốt",
      ],
      salary: 25000000,
      experienceLevel: "Trung cấp",
      location: "TP Hồ Chí Minh",
      jobType: "Toàn thời gian",
      position: 3,
      company: allCompanies[0]._id,
      created_by: admins[0]._id,
      applications: [],
    });
    await Job.insertMany(jobs);
    console.log("Đã tạo 101 công việc (bao gồm 1 mẫu cụ thể)");
    const allJobs = await Job.find();

    // Tạo application (bao gồm mẫu đơn ứng tuyển)
    const applications = [];
    for (let i = 0; i < 100; i++) {
      const candidate = faker.helpers.arrayElement(candidates);
      const job = faker.helpers.arrayElement(allJobs);
      applications.push({
        job: job._id,
        applicant: candidate._id,
        status: faker.helpers.arrayElement(["pending", "accepted", "rejected"]),
      });
      // Cập nhật appliedJobs của user
      await User.findByIdAndUpdate(candidate._id, {
        $push: { appliedJobs: job._id },
      });
    }
    // Thêm một đơn ứng tuyển mẫu cụ thể
    applications.push({
      job: allJobs[allJobs.length - 1]._id, // Công việc mẫu "Lập trình viên Backend"
      applicant: candidates[0]._id,
      status: "pending",
    });
    await User.findByIdAndUpdate(candidates[0]._id, {
      $push: { appliedJobs: allJobs[allJobs.length - 1]._id },
    });
    await Application.insertMany(applications);
    console.log("Đã tạo 101 đơn ứng tuyển (bao gồm 1 mẫu cụ thể)");

    // Gán application vào job
    const allApplications = await Application.find();
    for (const app of allApplications) {
      await Job.findByIdAndUpdate(app.job, {
        $push: { applications: app._id },
      });
    }
    console.log("Đã gán đơn ứng tuyển vào công việc");

    // Tạo notification
    const notifications = [];
    for (let i = 0; i < 100; i++) {
      const user = faker.helpers.arrayElement(candidates);
      const job = faker.helpers.arrayElement(allJobs);
      notifications.push({
        user: user._id,
        message: `Đơn ứng tuyển của bạn cho vị trí ${job.title} đã được gửi.`,
        read: faker.datatype.boolean(),
        meta: { jobId: job._id },
      });
    }
    await Notification.insertMany(notifications);
    console.log("Đã tạo 100 thông báo");

    // Tạo tài khoản admin và user cụ thể
    await User.insertMany([
      {
        fullname: "Quản trị viên",
        email: "admin@gmail.com",
        phoneNumber: "0987654321",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        profile: {
          bio: "Tài khoản quản trị viên",
          skills: [],
          resume: { url: "", title: "", originalName: "" },
          resumeOriginalName: "",
          profilePhoto: "",
        },
        savedJobs: [],
        appliedJobs: [],
      },
      {
        fullname: "Thịnh",
        email: "ldt@gmail.com",
        phoneNumber: "0987654321",
        password: await bcrypt.hash("123456", 10),
        role: "user",
        profile: {
          bio: "Tài khoản người dùng",
          skills: ["Lập trình Python", "ReactJS"],
          resume: {
            url: faker.internet.url(),
            title: "CV_Thịnh.pdf",
            originalName: "CV_Thịnh.pdf",
          },
          resumeOriginalName: "CV_Thịnh.pdf",
          profilePhoto: faker.image.avatar(),
          githubUsername: "thinhldt",
          linkedinUsername: "thinhldt",
          facebookUsername: "thinhldt",
        },
        savedJobs: [],
        appliedJobs: [],
      },
    ]);
    console.log("Đã tạo tài khoản admin: admin@viecLamVN.com và user: ldt@viecLamVN.com");

    console.log("✅ Dữ liệu đã được tạo thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi tạo dữ liệu:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Đã đóng kết nối MongoDB");
  }
}

seedDatabase();