// ─────────────────────────────────────────────────────────────────────────────
//  E-Commerce Application — Express + MongoDB Backend
//  Supports: Products, Cart, Orders, Categories, Search
// ─────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB Connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    seedProducts(); // seed sample products on first run
  })
  .catch((err) => { console.error("❌ MongoDB error:", err.message); process.exit(1); });

// ── Schemas ───────────────────────────────────────────────────────────────────

// Product
const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price:       { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0 },
  category:    { type: String, required: true, trim: true },
  brand:       { type: String, default: "" },
  image:       { type: String, default: "" },
  rating:      { type: Number, default: 4.0, min: 0, max: 5 },
  reviews:     { type: Number, default: 0 },
  stock:       { type: Number, default: 100 },
  tags:        [String],
  featured:    { type: Boolean, default: false },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// Order
const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:        String,
  price:       Number,
  quantity:    { type: Number, default: 1 },
  image:       String,
});

const orderSchema = new mongoose.Schema({
  orderId:     { type: String, unique: true },
  customer: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, default: "" },
    address: { type: String, required: true },
    city:    { type: String, default: "" },
    pincode: { type: String, default: "" },
  },
  items:       [orderItemSchema],
  subtotal:    Number,
  tax:         Number,
  shipping:    Number,
  total:       Number,
  paymentMethod: { type: String, enum: ["cod", "card", "upi"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  status: {
    type: String,
    enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"],
    default: "placed",
  },
}, { timestamps: true });

orderSchema.pre("save", async function () {
  if (this.isNew && !this.orderId) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderId = "ORD" + String(count + 1).padStart(6, "0");
  }
});

const Order = mongoose.model("Order", orderSchema);

// ── asyncHandler ──────────────────────────────────────────────────────────────
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Seed Products ─────────────────────────────────────────────────────────────
async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;

  const products = [
    // Electronics
    { name: "Wireless Noise-Cancelling Headphones", description: "Premium sound with 30hr battery life and active noise cancellation. Perfect for travel and work.", price: 2999, originalPrice: 5999, category: "Electronics", brand: "SoundPro", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", rating: 4.5, reviews: 1240, stock: 50, featured: true, tags: ["audio", "wireless", "travel"] },
    { name: "Smart Watch Series X", description: "Track fitness, receive notifications, and monitor health with GPS and heart rate monitor.", price: 4499, originalPrice: 8999, category: "Electronics", brand: "TechWear", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", rating: 4.3, reviews: 876, stock: 30, featured: true, tags: ["fitness", "smart", "wearable"] },
    { name: "Mechanical Keyboard RGB", description: "Tactile Blue switches with per-key RGB lighting. Built for gamers and programmers.", price: 3299, originalPrice: 4999, category: "Electronics", brand: "KeyMaster", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop", rating: 4.6, reviews: 543, stock: 45 },
    { name: "4K Webcam Pro", description: "Crystal-clear 4K video with auto-focus and built-in noise-cancelling mic for video calls.", price: 5499, originalPrice: 7999, category: "Electronics", brand: "ViewCam", image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop", rating: 4.2, reviews: 312, stock: 20 },

    // Fashion
    { name: "Premium Cotton Casual Shirt", description: "100% Egyptian cotton breathable shirt. Slim fit, perfect for casual and semi-formal occasions.", price: 899, originalPrice: 1799, category: "Fashion", brand: "StyleCo", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop", rating: 4.1, reviews: 2100, stock: 200, featured: true, tags: ["cotton", "casual", "shirt"] },
    { name: "Leather Crossbody Bag", description: "Genuine full-grain leather with multiple compartments. Handcrafted, durable, timeless.", price: 2199, originalPrice: 3999, category: "Fashion", brand: "LeatherLux", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop", rating: 4.4, reviews: 788, stock: 60 },
    { name: "Running Sneakers Ultra", description: "Lightweight foam cushioning with breathable mesh upper. Ideal for daily runs and gym.", price: 1799, originalPrice: 2999, category: "Fashion", brand: "SpeedRun", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", rating: 4.5, reviews: 1560, stock: 80 },

    // Home & Kitchen
    { name: "Air Fryer 5.5L Digital", description: "Cook crispy food with 80% less oil. 12 preset programs with digital touch panel.", price: 3499, originalPrice: 5999, category: "Home & Kitchen", brand: "CrispCook", image: "https://images.unsplash.com/photo-1626508035297-0e75e7c0ef14?w=400&h=400&fit=crop", rating: 4.6, reviews: 3400, stock: 35, featured: true, tags: ["cooking", "healthy", "kitchen"] },
    { name: "Stainless Steel Water Bottle 1L", description: "Double-wall vacuum insulation keeps drinks cold 24h, hot 12h. BPA-free, leak-proof.", price: 699, originalPrice: 1299, category: "Home & Kitchen", brand: "PureFlow", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop", rating: 4.3, reviews: 4200, stock: 300 },
    { name: "Scented Soy Candle Set", description: "Set of 4 hand-poured soy candles — lavender, vanilla, sandalwood, citrus. 45h burn time each.", price: 999, originalPrice: 1599, category: "Home & Kitchen", brand: "AromaCo", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=400&fit=crop", rating: 4.7, reviews: 920, stock: 150 },

    // Books
    { name: "Atomic Habits — James Clear", description: "The #1 bestseller on building good habits and breaking bad ones. Life-changing framework.", price: 399, originalPrice: 699, category: "Books", brand: "Penguin", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop", rating: 4.9, reviews: 12000, stock: 500, featured: true, tags: ["self-help", "productivity", "habits"] },
    { name: "The Psychology of Money", description: "Timeless lessons on wealth, greed, and happiness. A must-read for every investor.", price: 349, originalPrice: 599, category: "Books", brand: "Jaico", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=400&fit=crop", rating: 4.8, reviews: 8700, stock: 400 },

    // Sports
    { name: "Yoga Mat Premium 6mm", description: "Non-slip eco-friendly TPE material. Extra thick for joint support. Includes carry strap.", price: 1199, originalPrice: 1999, category: "Sports", brand: "ZenFlex", image: "https://images.unsplash.com/photo-1601925228075-99b42d5b074c?w=400&h=400&fit=crop", rating: 4.4, reviews: 2300, stock: 120 },
    { name: "Resistance Bands Set (5pcs)", description: "5 resistance levels from 10–50 lbs. Latex-free, durable, portable home gym solution.", price: 799, originalPrice: 1499, category: "Sports", brand: "FlexBand", image: "https://images.unsplash.com/photo-1598632640487-6ea4a4e8b963?w=400&h=400&fit=crop", rating: 4.3, reviews: 1800, stock: 200 },
  ];

  await Product.insertMany(products);
  console.log(`🌱 Seeded ${products.length} products`);
}

// ── Product Routes ────────────────────────────────────────────────────────────

// GET all products (filter, search, sort, pagination)
app.get("/api/products", ah(async (req, res) => {
  const { category, search, sort = "createdAt", order = "desc",
          featured, limit = 20, page = 1, minPrice, maxPrice } = req.query;
  const query = {};

  if (category) query.category = category;
  if (featured === "true") query.featured = true;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  if (search) {
    query.$or = [
      { name:        { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand:       { $regex: search, $options: "i" } },
      { tags:        { $in: [new RegExp(search, "i")] } },
    ];
  }

  const skip    = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === "asc" ? 1 : -1 };
  const total   = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortObj).skip(skip).limit(parseInt(limit));

  res.json({ products, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
}));

// GET categories list
app.get("/api/categories", ah(async (req, res) => {
  const cats = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(cats.map((c) => ({ name: c._id, count: c.count })));
}));

// GET single product
app.get("/api/products/:id", ah(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
}));

// GET featured products
app.get("/api/featured", ah(async (req, res) => {
  const products = await Product.find({ featured: true }).limit(8);
  res.json(products);
}));

// ── Order Routes ──────────────────────────────────────────────────────────────

// POST place order (simulate purchase)
app.post("/api/orders", ah(async (req, res) => {
  const { customer, items, paymentMethod } = req.body;

  if (!customer || !items || !items.length)
    return res.status(400).json({ message: "Customer info and items are required" });

  // Fetch real prices from DB (never trust client prices)
  let subtotal = 0;
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
    if (product.stock < item.quantity)
      return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

    subtotal += product.price * item.quantity;
    orderItems.push({ productId: product._id, name: product.name, price: product.price, quantity: item.quantity, image: product.image });

    // Decrement stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
  }

  const tax      = parseFloat((subtotal * 0.18).toFixed(2));
  const shipping = subtotal > 999 ? 0 : 99;
  const total    = parseFloat((subtotal + tax + shipping).toFixed(2));

  const order = new Order({
    customer,
    items: orderItems,
    subtotal, tax, shipping, total,
    paymentMethod: paymentMethod || "cod",
    paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
  });

  const saved = await order.save();
  res.status(201).json({ message: "Order placed successfully!", order: saved });
}));

// GET all orders
app.get("/api/orders", ah(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
  res.json(orders);
}));

// GET single order by orderId
app.get("/api/orders/:orderId", ah(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
}));

// PATCH cancel order
app.patch("/api/orders/:orderId/cancel", ah(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (["shipped", "delivered"].includes(order.status))
    return res.status(400).json({ message: "Cannot cancel order after it has shipped" });

  order.status = "cancelled";
  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }
  await order.save();
  res.json({ message: "Order cancelled", order });
}));

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get("/api/stats", ah(async (req, res) => {
  const [totalProducts, totalOrders, revenueAgg, topCategories] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments({ status: { $ne: "cancelled" } }),
    Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.aggregate([{ $unwind: "$items" }, { $group: { _id: "$items.name", sold: { $sum: "$items.quantity" } } }, { $sort: { sold: -1 } }, { $limit: 5 }]),
  ]);
  res.json({ totalProducts, totalOrders, revenue: revenueAgg[0]?.total?.toFixed(2) || "0.00", topCategories });
}));

app.get("/api/health", (req, res) => res.json({ status: "OK", ts: new Date().toISOString() }));

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥", err.message);
  if (err.code === 11000) return res.status(409).json({ message: "Duplicate entry" });
  const status = err.name === "ValidationError" ? 400 : err.name === "CastError" ? 404 : 500;
  res.status(status).json({ message: err.message || "Server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🛍  E-Commerce API → http://localhost:${PORT}`));
