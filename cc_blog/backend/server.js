// ─────────────────────────────────────────────────────────────────────────────
//  Blog Application — Express + MongoDB Backend (Fixed)
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── MongoDB Connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Schemas ───────────────────────────────────────────────────────────────────

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
      default: "",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      default: "Anonymous",
    },
    category: {
      type: String,
      enum: ["Technology", "Lifestyle", "Travel", "Food", "Health", "Business", "Other"],
      default: "Other",
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    coverImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    views: { type: Number, default: 0 },
    comments: [commentSchema],
  },
  { timestamps: true }
);

// ── FIX: Use async pre-save hook (no next() needed in Mongoose v7+) ───────────
postSchema.pre("save", async function () {
  if (this.isModified("title") || this.isNew) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() +
      "-" +
      Date.now();
  }
  if (!this.excerpt && this.content) {
    this.excerpt =
      this.content.replace(/<[^>]+>/g, "").substring(0, 200) + "...";
  }
});

const Post = mongoose.model("Post", postSchema);

// ── asyncHandler (try/catch wrapper) ─────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// GET all posts
app.get(
  "/api/posts",
  asyncHandler(async (req, res) => {
    const { status, category, search, limit = 20, page = 1 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content");

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// GET single post (increments views)
app.get(
  "/api/posts/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  })
);

// POST create post
app.post(
  "/api/posts",
  asyncHandler(async (req, res) => {
    const { title, content, author, category, tags, excerpt, coverImage, status } = req.body;
    const post = new Post({ title, content, author, category, tags, excerpt, coverImage, status });
    const saved = await post.save();
    res.status(201).json(saved);
  })
);

// PUT update post
app.put(
  "/api/posts/:id",
  asyncHandler(async (req, res) => {
    const { title, content, author, category, tags, excerpt, coverImage, status } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    Object.assign(post, { title, content, author, category, tags, excerpt, coverImage, status });
    const updated = await post.save();
    res.json(updated);
  })
);

// DELETE post
app.delete(
  "/api/posts/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted successfully", id: req.params.id });
  })
);

// POST add comment
app.post(
  "/api/posts/:id/comments",
  asyncHandler(async (req, res) => {
    const { author, content } = req.body;
    if (!author || !content)
      return res.status(400).json({ message: "Author and content are required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ author, content });
    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  })
);

// DELETE comment
app.delete(
  "/api/posts/:id/comments/:commentId",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments = post.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );
    await post.save();
    res.json({ message: "Comment deleted" });
  })
);

// GET stats
app.get(
  "/api/stats",
  asyncHandler(async (req, res) => {
    const [total, published, drafts, viewsAgg] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: "published" }),
      Post.countDocuments({ status: "draft" }),
      Post.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    ]);
    res.json({
      total,
      published,
      drafts,
      totalViews: viewsAgg[0]?.total || 0,
    });
  })
);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Error:", err.message);
  const status =
    err.name === "ValidationError" ? 400
    : err.name === "CastError" ? 404
    : 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Blog server → http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});
