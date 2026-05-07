// ─────────────────────────────────────────────────────────────────────────────
//  Student Records Management System — Express + MongoDB Backend
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB Connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Student Schema ────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: { type: String, trim: true, default: "" },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: [
        "Computer Science", "Information Technology", "Electronics",
        "Mechanical", "Civil", "Business Administration",
        "Mathematics", "Physics", "Other",
      ],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: 1,
      max: 5,
    },
    semester: { type: Number, min: 1, max: 10, default: 1 },
    gpa:      { type: Number, min: 0, max: 10, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "suspended"],
      default: "active",
    },
    address:      { type: String, trim: true, default: "" },
    dateOfBirth:  { type: Date },
    enrollmentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-generate studentId (no next() — Mongoose v7+ async style)
studentSchema.pre("save", async function () {
  if (this.isNew && !this.studentId) {
    const count = await mongoose.model("Student").countDocuments();
    this.studentId = "STU" + String(count + 1).padStart(4, "0");
  }
});

const Student = mongoose.model("Student", studentSchema);

// ── asyncHandler ──────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// GET all students (search, filter, pagination)
app.get("/api/students", asyncHandler(async (req, res) => {
  const { search, department, status, year, limit = 50, page = 1 } = req.query;
  const query = {};

  if (department) query.department = department;
  if (status)     query.status = status;
  if (year)       query.year = parseInt(year);
  if (search) {
    query.$or = [
      { firstName:  { $regex: search, $options: "i" } },
      { lastName:   { $regex: search, $options: "i" } },
      { email:      { $regex: search, $options: "i" } },
      { studentId:  { $regex: search, $options: "i" } },
    ];
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    students,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
}));

// GET single student
app.get("/api/students/:id", asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
}));

// POST create student
app.post("/api/students", asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, department,
          year, semester, gpa, status, address, dateOfBirth } = req.body;
  const student = new Student({ firstName, lastName, email, phone,
    department, year, semester, gpa, status, address, dateOfBirth });
  const saved = await student.save();
  res.status(201).json(saved);
}));

// PUT update student
app.put("/api/students/:id", asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, department,
          year, semester, gpa, status, address, dateOfBirth } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  Object.assign(student, { firstName, lastName, email, phone,
    department, year, semester, gpa, status, address, dateOfBirth });
  const updated = await student.save();
  res.json(updated);
}));

// DELETE student
app.delete("/api/students/:id", asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ message: "Student deleted successfully", id: req.params.id });
}));

// GET dashboard stats
app.get("/api/stats", asyncHandler(async (req, res) => {
  const [total, active, graduated, avgGpaResult, deptBreakdown] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: "active" }),
    Student.countDocuments({ status: "graduated" }),
    Student.aggregate([{ $group: { _id: null, avg: { $avg: "$gpa" } } }]),
    Student.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
  ]);
  res.json({
    total, active, graduated,
    avgGpa: avgGpaResult[0]?.avg?.toFixed(2) || "0.00",
    departments: deptBreakdown,
  });
}));

app.use((err, req, res, next) => {
  console.error("💥 Error:", err.message);
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} already exists` });
  }
  const status = err.name === "ValidationError" ? 400
    : err.name === "CastError" ? 404 : 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Student Records → http://localhost:${PORT}`);
  console.log(`📦 Env: ${process.env.NODE_ENV || "development"}`);
});