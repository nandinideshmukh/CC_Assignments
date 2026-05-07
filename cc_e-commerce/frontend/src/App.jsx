import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Config ─────────────────────────────────────────────────────────────────────
const API = "http://localhost:5000/api";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home & Kitchen", "Books", "Sports"];

const CAT_ICONS = {
  "All": "✦", "Electronics": "⚡", "Fashion": "👗",
  "Home & Kitchen": "🏠", "Books": "📚", "Sports": "🏃",
};

const PAYMENT_METHODS = [
  { id: "cod",  label: "Cash on Delivery", icon: "💵" },
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "upi",  label: "UPI Payment", icon: "📱" },
];

// ── Seed fallback products ────────────────────────────────────────────────────
const SEED_PRODUCTS = [
  { _id: "p1", name: "Wireless Noise-Cancelling Headphones", description: "Premium sound with 30hr battery life and active noise cancellation.", price: 2999, originalPrice: 5999, category: "Electronics", brand: "SoundPro", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", rating: 4.5, reviews: 1240, stock: 50, featured: true },
  { _id: "p2", name: "Smart Watch Series X", description: "Track fitness, receive notifications and monitor health with GPS.", price: 4499, originalPrice: 8999, category: "Electronics", brand: "TechWear", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", rating: 4.3, reviews: 876, stock: 30, featured: true },
  { _id: "p3", name: "Premium Cotton Casual Shirt", description: "100% Egyptian cotton breathable slim-fit shirt.", price: 899, originalPrice: 1799, category: "Fashion", brand: "StyleCo", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop", rating: 4.1, reviews: 2100, stock: 200, featured: true },
  { _id: "p4", name: "Air Fryer 5.5L Digital", description: "Cook crispy food with 80% less oil. 12 preset programs.", price: 3499, originalPrice: 5999, category: "Home & Kitchen", brand: "CrispCook", image: "https://images.unsplash.com/photo-1626508035297-0e75e7c0ef14?w=400&h=400&fit=crop", rating: 4.6, reviews: 3400, stock: 35, featured: true },
  { _id: "p5", name: "Atomic Habits — James Clear", description: "The #1 bestseller on building good habits and breaking bad ones.", price: 399, originalPrice: 699, category: "Books", brand: "Penguin", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop", rating: 4.9, reviews: 12000, stock: 500, featured: true },
  { _id: "p6", name: "Yoga Mat Premium 6mm", description: "Non-slip eco-friendly TPE material with carry strap.", price: 1199, originalPrice: 1999, category: "Sports", brand: "ZenFlex", image: "https://images.unsplash.com/photo-1601925228075-99b42d5b074c?w=400&h=400&fit=crop", rating: 4.4, reviews: 2300, stock: 120 },
  { _id: "p7", name: "Running Sneakers Ultra", description: "Lightweight foam cushioning with breathable mesh upper.", price: 1799, originalPrice: 2999, category: "Fashion", brand: "SpeedRun", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", rating: 4.5, reviews: 1560, stock: 80 },
  { _id: "p8", name: "Stainless Steel Water Bottle 1L", description: "Double-wall vacuum insulation. Keeps cold 24h, hot 12h.", price: 699, originalPrice: 1299, category: "Home & Kitchen", brand: "PureFlow", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop", rating: 4.3, reviews: 4200, stock: 300 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt  = (n) => "₹" + Number(n).toLocaleString("en-IN");
const disc = (p, op) => op > p ? Math.round(((op - p) / op) * 100) : 0;
const stars = (r) => "★".repeat(Math.floor(r)) + (r % 1 >= 0.5 ? "½" : "") + "☆".repeat(5 - Math.ceil(r));

export default function App() {
  // ── State ────────────────────────────────────────────────────────────────
  const [page, setPage]             = useState("home"); // home | shop | product | cart | checkout | orders | confirm
  const [products, setProducts]     = useState([]);
  const [featured, setFeatured]     = useState([]);
  const [selProduct, setSelProduct] = useState(null);
  const [cart, setCart]             = useState([]);
  const [orders, setOrders]         = useState([]);
  const [lastOrder, setLastOrder]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [dummy, setDummy]           = useState(false);
  const [search, setSearch]         = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [cat, setCat]               = useState("All");
  const [sort, setSort]             = useState("createdAt");
  const [qty, setQty]               = useState(1);
  const [checkStep, setCheckStep]   = useState(1); // 1=address, 2=payment, 3=review
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", pincode: "",
    paymentMethod: "cod",
  });
  const [formErr, setFormErr] = useState({});
  const heroRef = useRef(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, order: "desc", limit: 40 });
      if (cat !== "All") params.set("category", cat);
      if (activeSearch) params.set("search", activeSearch);
      const res = await fetch(`${API}/products?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products || []);
      setDummy(false);
    } catch {
      let filtered = SEED_PRODUCTS;
      if (cat !== "All") filtered = filtered.filter(p => p.category === cat);
      if (activeSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(activeSearch.toLowerCase()));
      setProducts(filtered);
      setDummy(true);
    } finally { setLoading(false); }
  }, [cat, activeSearch, sort]);

  const fetchFeatured = async () => {
    try {
      const res = await fetch(`${API}/featured`);
      if (res.ok) { const d = await res.json(); setFeatured(d); }
      else setFeatured(SEED_PRODUCTS.filter(p => p.featured));
    } catch { setFeatured(SEED_PRODUCTS.filter(p => p.featured)); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/orders`);
      if (res.ok) setOrders(await res.json());
    } catch { setOrders([]); }
  };

  useEffect(() => { fetchFeatured(); }, []);
  useEffect(() => { if (page === "shop") fetchProducts(); }, [page, fetchProducts]);
  useEffect(() => { if (page === "orders") fetchOrders(); }, [page]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Cart ─────────────────────────────────────────────────────────────────
  const cartTotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount    = cart.reduce((s, i) => s + i.quantity, 0);
  const tax          = parseFloat((cartTotal * 0.18).toFixed(2));
  const shipping     = cartTotal > 999 ? 0 : 99;
  const orderTotal   = parseFloat((cartTotal + tax + shipping).toFixed(2));

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product._id);
      if (existing) return prev.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { productId: product._id, name: product.name, price: product.price, image: product.image, quantity }];
    });
    showToast(`${product.name.slice(0, 28)}… added to cart!`);
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const updateQty = (productId, q) => {
    if (q < 1) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: q } : i));
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Required";
    if (!form.email.trim())   e.email   = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim())    e.city    = "Required";
    if (!form.pincode.trim()) e.pincode = "Required";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    try {
      const payload = {
        customer: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode },
        items: cart,
        paymentMethod: form.paymentMethod,
      };
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLastOrder(data.order);
      setCart([]);
      setForm({ name: "", email: "", phone: "", address: "", city: "", pincode: "", paymentMethod: "cod" });
      setCheckStep(1);
      setPage("confirm");
    } catch (err) { showToast(err.message || "Order failed. Try again.", "error"); }
  };

  const ff = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setFormErr(p => ({ ...p, [k]: "" })); };

  // ── Product detail open ───────────────────────────────────────────────────
  const openProduct = async (product) => {
    try {
      const res = await fetch(`${API}/products/${product._id}`);
      if (res.ok) setSelProduct(await res.json());
      else setSelProduct(product);
    } catch { setSelProduct(product); }
    setQty(1);
    setPage("product");
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream:   #faf8f3;
          --warm:    #f5f0e8;
          --sand:    #e8dcc8;
          --brown:   #8b6914;
          --dark:    #1c1408;
          --muted:   #7a6a52;
          --accent:  #c8510a;
          --green:   #2d6a4f;
          --border:  #ddd4c0;
          --serif:   'Cormorant Garamond', Georgia, serif;
          --sans:    'Jost', sans-serif;
          --shadow:  0 2px 20px rgba(28,20,8,0.08);
          --shadow2: 0 8px 40px rgba(28,20,8,0.14);
        }

        body { background: var(--cream); color: var(--dark); font-family: var(--sans); min-height: 100vh; }
        ::selection { background: rgba(200,81,10,0.18); }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: var(--sand); }

        /* ── Nav ── */
        .nav {
          background: var(--dark); color: var(--cream);
          position: sticky; top: 0; z-index: 200;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 28px; display: flex; align-items: center; gap: 24px; height: 62px; }
        .logo { font-family: var(--serif); font-size: 26px; font-weight: 700; letter-spacing: 2px; cursor: pointer; color: var(--cream); flex-shrink: 0; }
        .logo span { color: #e8c87a; }
        .nav-search { flex: 1; max-width: 480px; display: flex; align-items: center; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0 14px; gap: 8px; }
        .nav-search input { background: none; border: none; outline: none; color: var(--cream); font-family: var(--sans); font-size: 13px; width: 100%; padding: 9px 0; }
        .nav-search input::placeholder { color: rgba(255,255,255,0.35); }
        .nav-search-btn { background: var(--accent); border: none; color: #fff; padding: 5px 12px; font-size: 12px; font-family: var(--sans); border-radius: 3px; cursor: pointer; white-space: nowrap; }
        .nav-links { display: flex; gap: 4px; margin-left: auto; }
        .nav-link { background: none; border: none; color: rgba(255,255,255,0.65); font-family: var(--sans); font-size: 13px; padding: 8px 12px; cursor: pointer; border-radius: 3px; transition: all 0.15s; white-space: nowrap; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-link.active { color: #e8c87a; }
        .cart-btn { background: var(--accent); color: #fff !important; border-radius: 4px; padding: 8px 14px !important; position: relative; }
        .cart-btn:hover { background: #b84509 !important; }
        .cart-count { position: absolute; top: 4px; right: 4px; width: 16px; height: 16px; background: #e8c87a; color: var(--dark); border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

        /* ── Container ── */
        .container { max-width: 1280px; margin: 0 auto; padding: 0 28px; }

        /* ── Hero ── */
        .hero {
          background: var(--dark); color: var(--cream);
          padding: 80px 0; position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 70% 50%, rgba(200,81,10,0.2) 0%, transparent 60%),
                      radial-gradient(ellipse at 20% 80%, rgba(232,200,122,0.1) 0%, transparent 50%);
        }
        .hero-inner { position: relative; display: grid; grid-template-columns: 1fr 420px; gap: 60px; align-items: center; }
        .hero-tag { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #e8c87a; margin-bottom: 18px; }
        .hero-title { font-family: var(--serif); font-size: clamp(40px, 5.5vw, 68px); font-weight: 300; line-height: 1.05; letter-spacing: -1px; margin-bottom: 20px; }
        .hero-title em { font-style: italic; color: #e8c87a; }
        .hero-sub { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.7; margin-bottom: 32px; max-width: 420px; font-weight: 300; }
        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-hero { padding: 13px 28px; font-family: var(--sans); font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 3px; cursor: pointer; transition: all 0.2s; border: none; }
        .btn-hero-primary { background: var(--accent); color: #fff; }
        .btn-hero-primary:hover { background: #b84509; transform: translateY(-1px); }
        .btn-hero-outline { background: transparent; color: var(--cream); border: 1px solid rgba(255,255,255,0.3); }
        .btn-hero-outline:hover { border-color: #e8c87a; color: #e8c87a; }
        .hero-products { display: flex; flex-direction: column; gap: 12px; }
        .hero-product-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; display: flex; align-items: center; gap: 14px; padding: 12px; cursor: pointer; transition: all 0.2s; }
        .hero-product-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(232,200,122,0.3); transform: translateX(4px); }
        .hero-product-img { width: 52px; height: 52px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: var(--sand); }
        .hero-product-name { font-size: 13px; font-weight: 500; color: var(--cream); }
        .hero-product-price { font-size: 13px; color: #e8c87a; font-weight: 600; margin-top: 2px; }

        /* ── Section ── */
        .section { padding: 60px 0; }
        .section-header { display: flex; align-items: baseline; gap: 20px; margin-bottom: 36px; }
        .section-title { font-family: var(--serif); font-size: clamp(26px, 3vw, 38px); font-weight: 400; letter-spacing: -0.5px; }
        .section-title em { font-style: italic; color: var(--brown); }
        .section-line { flex: 1; height: 1px; background: var(--sand); }
        .view-all { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); cursor: pointer; background: none; border: none; font-family: var(--sans); white-space: nowrap; }
        .view-all:hover { color: var(--accent); }

        /* ── Category pills ── */
        .cat-pills { display: flex; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
        .cat-pill { background: #fff; border: 1.5px solid var(--border); color: var(--muted); padding: 8px 18px; border-radius: 100px; font-family: var(--sans); font-size: 13px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
        .cat-pill:hover { border-color: var(--brown); color: var(--dark); }
        .cat-pill.active { background: var(--dark); border-color: var(--dark); color: var(--cream); }

        /* ── Product grid ── */
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; }
        .product-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.22s; }
        .product-card:hover { box-shadow: var(--shadow2); transform: translateY(-4px); border-color: var(--sand); }
        .product-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--warm); }
        .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .product-card:hover .product-img { transform: scale(1.06); }
        .disc-badge { position: absolute; top: 10px; left: 10px; background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 3px; letter-spacing: 0.5px; }
        .product-body { padding: 14px; }
        .product-brand { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
        .product-name { font-size: 14px; font-weight: 500; line-height: 1.35; margin-bottom: 8px; color: var(--dark); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .product-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
        .stars { font-size: 11px; color: #f59e0b; letter-spacing: 1px; }
        .rating-count { font-size: 11px; color: var(--muted); }
        .product-pricing { display: flex; align-items: baseline; gap: 8px; }
        .price { font-family: var(--serif); font-size: 20px; font-weight: 600; color: var(--dark); }
        .original-price { font-size: 13px; color: var(--muted); text-decoration: line-through; }
        .add-btn { width: 100%; background: var(--dark); color: var(--cream); border: none; padding: 10px; font-family: var(--sans); font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; margin-top: 12px; border-radius: 5px; transition: background 0.15s; }
        .add-btn:hover { background: var(--accent); }
        .oos-btn { background: var(--sand); color: var(--muted); cursor: not-allowed; }

        /* ── Sort bar ── */
        .sort-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .sort-count { font-size: 13px; color: var(--muted); }
        .sort-select { background: #fff; border: 1px solid var(--border); color: var(--dark); padding: 7px 12px; border-radius: 5px; font-family: var(--sans); font-size: 13px; outline: none; }

        /* ── Product detail ── */
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; padding: 48px 0; }
        .detail-img-wrap { background: var(--warm); border-radius: 12px; overflow: hidden; aspect-ratio: 1; }
        .detail-img { width: 100%; height: 100%; object-fit: cover; }
        .detail-brand { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .detail-name { font-family: var(--serif); font-size: clamp(24px, 3vw, 38px); font-weight: 400; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px; }
        .detail-rating { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .detail-desc { font-size: 15px; color: var(--muted); line-height: 1.75; margin-bottom: 24px; font-weight: 300; }
        .detail-pricing { display: flex; align-items: baseline; gap: 14px; margin-bottom: 10px; }
        .detail-price { font-family: var(--serif); font-size: 36px; font-weight: 600; color: var(--dark); }
        .detail-original { font-size: 18px; color: var(--muted); text-decoration: line-through; }
        .detail-savings { font-size: 13px; color: var(--green); font-weight: 600; margin-bottom: 24px; }
        .detail-stock { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
        .in-stock { color: var(--green); } .low-stock { color: var(--accent); } .no-stock { color: #ef4444; }
        .qty-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
        .qty-label { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
        .qty-control { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 5px; overflow: hidden; }
        .qty-btn { background: var(--warm); border: none; width: 36px; height: 36px; font-size: 16px; cursor: pointer; color: var(--dark); transition: background 0.1s; }
        .qty-btn:hover { background: var(--sand); }
        .qty-num { width: 48px; text-align: center; font-size: 15px; font-weight: 600; border: none; background: #fff; outline: none; font-family: var(--sans); }
        .btn-detail-add { background: var(--dark); color: var(--cream); border: none; padding: 15px 32px; font-family: var(--sans); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; border-radius: 5px; cursor: pointer; width: 100%; transition: background 0.15s; margin-bottom: 10px; }
        .btn-detail-add:hover { background: var(--accent); }
        .btn-back { background: none; border: none; font-family: var(--sans); font-size: 13px; color: var(--muted); cursor: pointer; padding: 20px 0; display: flex; align-items: center; gap: 6px; letter-spacing: 0.5px; }
        .btn-back:hover { color: var(--accent); }

        /* ── Cart ── */
        .cart-wrap { max-width: 900px; margin: 0 auto; padding: 40px 28px; }
        .cart-title { font-family: var(--serif); font-size: 32px; font-weight: 400; margin-bottom: 32px; }
        .cart-layout { display: grid; grid-template-columns: 1fr 300px; gap: 28px; align-items: start; }
        .cart-item { display: flex; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--border); align-items: center; }
        .cart-item-img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; background: var(--warm); flex-shrink: 0; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .cart-item-price { font-family: var(--serif); font-size: 18px; font-weight: 600; color: var(--dark); }
        .cart-item-controls { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
        .cart-remove { background: none; border: none; color: #ef4444; font-size: 12px; cursor: pointer; font-family: var(--sans); letter-spacing: 0.5px; }
        .cart-remove:hover { text-decoration: underline; }
        .summary-card { background: var(--warm); border: 1px solid var(--border); border-radius: 10px; padding: 22px; position: sticky; top: 80px; }
        .summary-title { font-family: var(--serif); font-size: 20px; margin-bottom: 18px; font-weight: 600; }
        .summary-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--muted); margin-bottom: 10px; }
        .summary-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; border-top: 1.5px solid var(--border); margin-top: 14px; padding-top: 14px; }
        .summary-note { font-size: 11px; color: var(--green); margin: 8px 0; }
        .btn-checkout { width: 100%; background: var(--accent); color: #fff; border: none; padding: 14px; font-family: var(--sans); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; border-radius: 5px; cursor: pointer; margin-top: 16px; transition: background 0.15s; }
        .btn-checkout:hover { background: #b84509; }

        /* ── Checkout ── */
        .checkout-wrap { max-width: 820px; margin: 0 auto; padding: 40px 28px; }
        .checkout-title { font-family: var(--serif); font-size: 32px; font-weight: 400; margin-bottom: 8px; }
        .checkout-steps { display: flex; gap: 0; margin-bottom: 36px; margin-top: 20px; }
        .step { display: flex; align-items: center; gap: 10px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
        .step.active { color: var(--dark); font-weight: 600; }
        .step-num { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 12px; }
        .step.active .step-num { background: var(--dark); color: var(--cream); border-color: var(--dark); }
        .step.done .step-num { background: var(--green); color: #fff; border-color: var(--green); }
        .step-line { width: 40px; height: 1px; background: var(--border); margin: 0 8px; }
        .checkout-grid { display: grid; grid-template-columns: 1fr 280px; gap: 28px; }
        .form-section { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 24px; }
        .form-section-title { font-family: var(--serif); font-size: 18px; margin-bottom: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1/-1; }
        .form-label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); font-weight: 600; }
        .form-input { border: 1.5px solid var(--border); padding: 10px 13px; border-radius: 5px; font-family: var(--sans); font-size: 14px; outline: none; transition: border 0.15s; background: var(--cream); color: var(--dark); }
        .form-input:focus { border-color: var(--brown); }
        .form-input.err { border-color: #ef4444; }
        .form-err-msg { font-size: 11px; color: #ef4444; }
        .payment-opts { display: flex; flex-direction: column; gap: 10px; }
        .payment-opt { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border: 1.5px solid var(--border); border-radius: 7px; cursor: pointer; transition: all 0.15s; }
        .payment-opt.selected { border-color: var(--brown); background: rgba(139,105,20,0.06); }
        .payment-opt-icon { font-size: 20px; }
        .payment-opt-label { font-size: 14px; font-weight: 500; }
        .order-mini { font-size: 13px; }
        .order-mini-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); color: var(--muted); gap: 8px; }
        .order-mini-name { flex: 1; }
        .btn-next { background: var(--dark); color: var(--cream); border: none; padding: 13px 28px; font-family: var(--sans); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; border-radius: 5px; cursor: pointer; transition: background 0.15s; margin-top: 20px; }
        .btn-next:hover { background: var(--accent); }
        .btn-prev { background: none; border: 1.5px solid var(--border); color: var(--muted); padding: 13px 22px; font-family: var(--sans); font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 5px; cursor: pointer; margin-right: 10px; margin-top: 20px; }

        /* ── Confirm ── */
        .confirm-wrap { max-width: 600px; margin: 80px auto; padding: 0 28px; text-align: center; }
        .confirm-icon { font-size: 64px; margin-bottom: 20px; animation: pop 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        .confirm-title { font-family: var(--serif); font-size: 38px; font-weight: 400; margin-bottom: 10px; }
        .confirm-sub { font-size: 15px; color: var(--muted); margin-bottom: 32px; line-height: 1.65; }
        .confirm-order-id { background: var(--warm); border: 1px solid var(--border); border-radius: 8px; padding: 16px 24px; display: inline-block; font-family: monospace; font-size: 18px; font-weight: 700; color: var(--dark); letter-spacing: 2px; margin-bottom: 32px; }
        .confirm-details { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 22px; text-align: left; margin-bottom: 28px; }
        .confirm-row { display: flex; justify-content: space-between; font-size: 14px; padding: 7px 0; border-bottom: 1px solid var(--border); }
        .confirm-row:last-child { border-bottom: none; font-weight: 700; font-size: 15px; }
        .confirm-actions { display: flex; gap: 12px; justify-content: center; }

        /* ── Orders ── */
        .orders-wrap { max-width: 900px; margin: 0 auto; padding: 40px 28px; }
        .order-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin-bottom: 14px; }
        .order-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .order-id { font-family: monospace; font-size: 15px; font-weight: 700; }
        .order-status { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .status-placed    { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dbeafe; color: #1e40af; }
        .status-shipped   { background: #e0f2fe; color: #0369a1; }
        .status-delivered { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .order-items-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .order-thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; background: var(--warm); }
        .order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
        .order-total { font-family: var(--serif); font-size: 20px; font-weight: 600; }
        .order-date { font-size: 12px; color: var(--muted); }

        /* ── Toast ── */
        .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 6px; font-size: 13px; font-weight: 500; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.18); white-space: nowrap; animation: toastUp 0.3s ease; }
        .toast-success { background: var(--dark); color: var(--cream); }
        .toast-error   { background: #991b1b; color: #fff; }
        @keyframes toastUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

        .dummy-bar { background: #fef3c7; border-bottom: 1px solid #fde68a; padding: 8px 28px; font-size: 12px; color: #92400e; text-align: center; }
        .empty-state { text-align: center; padding: 80px 20px; color: var(--muted); }
        .empty-icon { font-size: 48px; margin-bottom: 14px; }
        .empty-text { font-family: var(--serif); font-size: 22px; font-style: italic; }

        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; } .hero-products { display: none; }
          .detail-grid { grid-template-columns: 1fr; }
          .cart-layout { grid-template-columns: 1fr; }
          .checkout-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .nav-search { display: none; }
          .products-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .container { padding: 0 16px; }
        }
      `}</style>

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✓ " : "✕ "}{toast.msg}</div>}

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="logo" onClick={() => setPage("home")}>BAZAAR<span>.</span></div>
          <div className="nav-search">
            <input placeholder="Search products, brands…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setActiveSearch(search); setPage("shop"); } }} />
            <button className="nav-search-btn" onClick={() => { setActiveSearch(search); setPage("shop"); }}>Search</button>
          </div>
          <div className="nav-links">
            <button className={`nav-link ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}>Home</button>
            <button className={`nav-link ${page === "shop" ? "active" : ""}`} onClick={() => { setCat("All"); setActiveSearch(""); setSearch(""); setPage("shop"); }}>Shop</button>
            <button className={`nav-link ${page === "orders" ? "active" : ""}`} onClick={() => setPage("orders")}>Orders</button>
            <button className={`nav-link cart-btn ${page === "cart" ? "active" : ""}`} onClick={() => setPage("cart")}>
              🛒 Cart {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {dummy && page !== "confirm" && (
        <div className="dummy-bar">⚠ Demo mode — backend offline. Sample products shown. Start your server &amp; connect MongoDB for live data.</div>
      )}

      {/* ── HOME ───────────────────────────────────────────────────────────── */}
      {page === "home" && (
        <>
          {/* Hero */}
          <div className="hero" ref={heroRef}>
            <div className="container">
              <div className="hero-inner">
                <div>
                  <div className="hero-tag">✦ New Arrivals · Summer 2025</div>
                  <h1 className="hero-title">Discover <em>Products</em><br />Worth Keeping</h1>
                  <p className="hero-sub">Curated electronics, fashion, home essentials, and more — delivered to your door with care and speed.</p>
                  <div className="hero-actions">
                    <button className="btn-hero btn-hero-primary" onClick={() => { setCat("All"); setPage("shop"); }}>Shop Now</button>
                    <button className="btn-hero btn-hero-outline" onClick={() => { setCat("Electronics"); setPage("shop"); }}>Electronics →</button>
                  </div>
                </div>
                <div className="hero-products">
                  {featured.slice(0, 4).map(p => (
                    <div className="hero-product-card" key={p._id} onClick={() => openProduct(p)}>
                      <img className="hero-product-img" src={p.image} alt={p.name} onError={(e) => e.target.style.display = "none"} />
                      <div>
                        <div className="hero-product-name">{p.name.slice(0, 34)}{p.name.length > 34 ? "…" : ""}</div>
                        <div className="hero-product-price">{fmt(p.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured */}
          <div className="section">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title"><em>Featured</em> Products</h2>
                <div className="section-line" />
                <button className="view-all" onClick={() => setPage("shop")}>View All →</button>
              </div>
              <div className="products-grid">
                {featured.map(p => {
                  const d = disc(p.price, p.originalPrice);
                  return (
                    <div className="product-card" key={p._id} onClick={() => openProduct(p)}>
                      <div className="product-img-wrap">
                        <img className="product-img" src={p.image} alt={p.name} />
                        {d > 0 && <span className="disc-badge">-{d}%</span>}
                      </div>
                      <div className="product-body">
                        <div className="product-brand">{p.brand}</div>
                        <div className="product-name">{p.name}</div>
                        <div className="product-rating">
                          <span className="stars">{"★".repeat(Math.floor(p.rating))}{"☆".repeat(5 - Math.floor(p.rating))}</span>
                          <span className="rating-count">({p.reviews?.toLocaleString()})</span>
                        </div>
                        <div className="product-pricing">
                          <span className="price">{fmt(p.price)}</span>
                          {p.originalPrice > p.price && <span className="original-price">{fmt(p.originalPrice)}</span>}
                        </div>
                        <button className={`add-btn ${p.stock === 0 ? "oos-btn" : ""}`}
                          onClick={(e) => { e.stopPropagation(); if (p.stock > 0) addToCart(p); }}>
                          {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Categories Strip */}
          <div style={{ background: "var(--warm)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "40px 0" }}>
            <div className="container">
              <div className="section-header" style={{ marginBottom: 24 }}>
                <h2 className="section-title">Shop by <em>Category</em></h2>
                <div className="section-line" />
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {CATEGORIES.filter(c => c !== "All").map(c => (
                  <div key={c} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, padding: "20px 28px", cursor: "pointer", textAlign: "center", minWidth: 120, transition: "all 0.2s" }}
                    onClick={() => { setCat(c); setPage("shop"); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brown)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{CAT_ICONS[c]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)" }}>{c}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── SHOP ───────────────────────────────────────────────────────────── */}
      {page === "shop" && (
        <div className="container">
          <div className="section">
            <div className="cat-pills">
              {CATEGORIES.map(c => (
                <button key={c} className={`cat-pill ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                  {CAT_ICONS[c]} {c}
                </button>
              ))}
            </div>
            <div className="sort-bar">
              <span className="sort-count">{products.length} product{products.length !== 1 ? "s" : ""}</span>
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="createdAt">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            {loading ? (
              <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-text">Loading products…</div></div>
            ) : products.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-text">No products found.</div></div>
            ) : (
              <div className="products-grid">
                {products.map(p => {
                  const d = disc(p.price, p.originalPrice);
                  return (
                    <div className="product-card" key={p._id} onClick={() => openProduct(p)}>
                      <div className="product-img-wrap">
                        <img className="product-img" src={p.image} alt={p.name} />
                        {d > 0 && <span className="disc-badge">-{d}%</span>}
                      </div>
                      <div className="product-body">
                        <div className="product-brand">{p.brand}</div>
                        <div className="product-name">{p.name}</div>
                        <div className="product-rating">
                          <span className="stars">{"★".repeat(Math.floor(p.rating))}{"☆".repeat(5 - Math.floor(p.rating))}</span>
                          <span className="rating-count">({p.reviews?.toLocaleString()})</span>
                        </div>
                        <div className="product-pricing">
                          <span className="price">{fmt(p.price)}</span>
                          {p.originalPrice > p.price && <span className="original-price">{fmt(p.originalPrice)}</span>}
                        </div>
                        <button className={`add-btn ${p.stock === 0 ? "oos-btn" : ""}`}
                          onClick={e => { e.stopPropagation(); if (p.stock > 0) addToCart(p); }}>
                          {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL ─────────────────────────────────────────────────── */}
      {page === "product" && selProduct && (
        <div className="container">
          <button className="btn-back" onClick={() => setPage("shop")}>← Back to Shop</button>
          <div className="detail-grid">
            <div className="detail-img-wrap">
              <img className="detail-img" src={selProduct.image} alt={selProduct.name} />
            </div>
            <div>
              <div className="detail-brand">{selProduct.brand}</div>
              <h1 className="detail-name">{selProduct.name}</h1>
              <div className="detail-rating">
                <span className="stars" style={{ fontSize: 16 }}>{"★".repeat(Math.floor(selProduct.rating))}{"☆".repeat(5 - Math.floor(selProduct.rating))}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{selProduct.rating} · {selProduct.reviews?.toLocaleString()} reviews</span>
              </div>
              <p className="detail-desc">{selProduct.description}</p>
              <div className="detail-pricing">
                <span className="detail-price">{fmt(selProduct.price)}</span>
                {selProduct.originalPrice > selProduct.price && <span className="detail-original">{fmt(selProduct.originalPrice)}</span>}
              </div>
              {selProduct.originalPrice > selProduct.price && (
                <div className="detail-savings">You save {fmt(selProduct.originalPrice - selProduct.price)} ({disc(selProduct.price, selProduct.originalPrice)}% off)</div>
              )}
              <div className={`detail-stock ${selProduct.stock > 10 ? "in-stock" : selProduct.stock > 0 ? "low-stock" : "no-stock"}`}>
                {selProduct.stock > 10 ? "✓ In Stock" : selProduct.stock > 0 ? `⚠ Only ${selProduct.stock} left!` : "✕ Out of Stock"}
              </div>
              {selProduct.stock > 0 && (
                <div className="qty-row">
                  <span className="qty-label">Qty</span>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span className="qty-num">{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(q => Math.min(selProduct.stock, q + 1))}>+</button>
                  </div>
                </div>
              )}
              <button className="btn-detail-add" disabled={selProduct.stock === 0}
                onClick={() => { addToCart(selProduct, qty); setQty(1); }}>
                {selProduct.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "13px 32px", fontFamily: "var(--sans)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase", borderRadius: 5, cursor: "pointer", width: "100%" }}
                onClick={() => { addToCart(selProduct, qty); setPage("cart"); }}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CART ───────────────────────────────────────────────────────────── */}
      {page === "cart" && (
        <div className="cart-wrap">
          <h2 className="cart-title">Your Cart <span style={{ fontSize: 18, color: "var(--muted)", fontWeight: 400 }}>({cartCount} item{cartCount !== 1 ? "s" : ""})</span></h2>
          {cart.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <div className="empty-text">Your cart is empty</div>
              <button style={{ marginTop: 20, background: "var(--dark)", color: "var(--cream)", border: "none", padding: "12px 28px", borderRadius: 5, fontFamily: "var(--sans)", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }} onClick={() => setPage("shop")}>Start Shopping</button>
            </div>
          ) : (
            <div className="cart-layout">
              <div>
                {cart.map(item => (
                  <div className="cart-item" key={item.productId}>
                    <img className="cart-item-img" src={item.image} alt={item.name} />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{fmt(item.price)}</div>
                      <div className="cart-item-controls">
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                          <span className="qty-num">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                        </div>
                        <button className="cart-remove" onClick={() => removeFromCart(item.productId)}>Remove</button>
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, flexShrink: 0 }}>
                      {fmt(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="summary-card">
                  <div className="summary-title">Order Summary</div>
                  <div className="summary-row"><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
                  <div className="summary-row"><span>Tax (18% GST)</span><span>{fmt(tax)}</span></div>
                  <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? <span style={{ color: "var(--green)" }}>FREE</span> : fmt(shipping)}</span></div>
                  {shipping > 0 && <div className="summary-note">📦 Add {fmt(999 - cartTotal)} more for free shipping</div>}
                  <div className="summary-total"><span>Total</span><span>{fmt(orderTotal)}</span></div>
                  <button className="btn-checkout" onClick={() => { setCheckStep(1); setPage("checkout"); }}>Proceed to Checkout →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHECKOUT ───────────────────────────────────────────────────────── */}
      {page === "checkout" && (
        <div className="checkout-wrap">
          <h2 className="checkout-title">Checkout</h2>
          <div className="checkout-steps">
            {[{ n: 1, label: "Address" }, { n: 2, label: "Payment" }, { n: 3, label: "Review" }].map((s, i) => (
              <React.Fragment key={s.n}>
                {i > 0 && <div className="step-line" />}
                <div className={`step ${checkStep === s.n ? "active" : checkStep > s.n ? "done" : ""}`}>
                  <div className="step-num">{checkStep > s.n ? "✓" : s.n}</div>
                  <span>{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="checkout-grid">
            <div>
              {/* Step 1: Address */}
              {checkStep === 1 && (
                <div className="form-section">
                  <div className="form-section-title">Delivery Address</div>
                  <div className="form-grid">
                    {[
                      { key: "name", label: "Full Name", placeholder: "Aarav Sharma", full: false },
                      { key: "email", label: "Email", placeholder: "aarav@email.com", full: false },
                      { key: "phone", label: "Phone", placeholder: "9876543210", full: false },
                      { key: "address", label: "Street Address", placeholder: "Flat 4B, Rose Apartments, MG Road", full: true },
                      { key: "city", label: "City", placeholder: "Pune", full: false },
                      { key: "pincode", label: "PIN Code", placeholder: "411001", full: false },
                    ].map(({ key, label, placeholder, full }) => (
                      <div className={`form-group${full ? " full" : ""}`} key={key}>
                        <label className="form-label">{label}</label>
                        <input className={`form-input${formErr[key] ? " err" : ""}`} placeholder={placeholder} value={form[key]} onChange={ff(key)} />
                        {formErr[key] && <span className="form-err-msg">{formErr[key]}</span>}
                      </div>
                    ))}
                  </div>
                  <button className="btn-next" onClick={() => { if (validateStep1()) setCheckStep(2); }}>Continue to Payment →</button>
                </div>
              )}

              {/* Step 2: Payment */}
              {checkStep === 2 && (
                <div className="form-section">
                  <div className="form-section-title">Payment Method</div>
                  <div className="payment-opts">
                    {PAYMENT_METHODS.map(pm => (
                      <div key={pm.id} className={`payment-opt ${form.paymentMethod === pm.id ? "selected" : ""}`}
                        onClick={() => setForm(p => ({ ...p, paymentMethod: pm.id }))}>
                        <span className="payment-opt-icon">{pm.icon}</span>
                        <span className="payment-opt-label">{pm.label}</span>
                        {form.paymentMethod === pm.id && <span style={{ marginLeft: "auto", color: "var(--green)", fontWeight: 700 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex" }}>
                    <button className="btn-prev" onClick={() => setCheckStep(1)}>← Back</button>
                    <button className="btn-next" onClick={() => setCheckStep(3)}>Review Order →</button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {checkStep === 3 && (
                <div className="form-section">
                  <div className="form-section-title">Review & Place Order</div>
                  <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--warm)", borderRadius: 7, fontSize: 13, color: "var(--muted)" }}>
                    <strong style={{ color: "var(--dark)" }}>Delivering to:</strong> {form.name}, {form.address}, {form.city} — {form.pincode}<br />
                    <strong style={{ color: "var(--dark)" }}>Payment:</strong> {PAYMENT_METHODS.find(p => p.id === form.paymentMethod)?.label}
                  </div>
                  <div className="order-mini">
                    {cart.map(item => (
                      <div className="order-mini-item" key={item.productId}>
                        <span className="order-mini-name">{item.name} × {item.quantity}</span>
                        <span>{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontSize: 15 }}>
                      <span>Total (incl. taxes)</span><span>{fmt(orderTotal)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex" }}>
                    <button className="btn-prev" onClick={() => setCheckStep(2)}>← Back</button>
                    <button className="btn-next" style={{ background: "var(--accent)" }} onClick={placeOrder}>Place Order ✓</button>
                  </div>
                </div>
              )}
            </div>

            {/* Mini summary sidebar */}
            <div className="summary-card">
              <div className="summary-title">Cart Summary</div>
              {cart.map(item => (
                <div key={item.productId} className="order-mini-item" style={{ paddingTop: 8 }}>
                  <span className="order-mini-name" style={{ color: "var(--dark)" }}>{item.name.slice(0, 22)}… ×{item.quantity}</span>
                  <span style={{ color: "var(--dark)", fontWeight: 600 }}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="summary-row" style={{ marginTop: 14 }}><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
              <div className="summary-row"><span>GST (18%)</span><span>{fmt(tax)}</span></div>
              <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? "FREE" : fmt(shipping)}</span></div>
              <div className="summary-total"><span>Total</span><span style={{ color: "var(--accent)" }}>{fmt(orderTotal)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM ────────────────────────────────────────────────────────── */}
      {page === "confirm" && lastOrder && (
        <div className="confirm-wrap">
          <div className="confirm-icon">🎉</div>
          <h2 className="confirm-title">Order Placed!</h2>
          <p className="confirm-sub">Thank you for shopping with Bazaar. Your order has been received and will be processed shortly.</p>
          <div className="confirm-order-id">{lastOrder.orderId}</div>
          <div className="confirm-details">
            {lastOrder.items.map(item => (
              <div className="confirm-row" key={item.productId || item._id}>
                <span>{item.name} × {item.quantity}</span>
                <span>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="confirm-row"><span>Tax</span><span>{fmt(lastOrder.tax)}</span></div>
            <div className="confirm-row"><span>Shipping</span><span>{lastOrder.shipping === 0 ? "FREE" : fmt(lastOrder.shipping)}</span></div>
            <div className="confirm-row"><span>Total Paid</span><span style={{ color: "var(--accent)" }}>{fmt(lastOrder.total)}</span></div>
          </div>
          <div className="confirm-actions">
            <button style={{ background: "var(--dark)", color: "var(--cream)", border: "none", padding: "12px 28px", borderRadius: 5, fontFamily: "var(--sans)", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }} onClick={() => setPage("orders")}>View My Orders</button>
            <button style={{ background: "none", color: "var(--dark)", border: "1.5px solid var(--border)", padding: "12px 24px", borderRadius: 5, fontFamily: "var(--sans)", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }} onClick={() => setPage("home")}>Continue Shopping</button>
          </div>
        </div>
      )}

      {/* ── ORDERS ─────────────────────────────────────────────────────────── */}
      {page === "orders" && (
        <div className="orders-wrap">
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 400, marginBottom: 28 }}>My Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-text">No orders yet. Start shopping!</div>
              <button style={{ marginTop: 20, background: "var(--dark)", color: "var(--cream)", border: "none", padding: "12px 28px", borderRadius: 5, fontFamily: "var(--sans)", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }} onClick={() => setPage("shop")}>Shop Now</button>
            </div>
          ) : (
            orders.map(order => (
              <div className="order-card" key={order._id}>
                <div className="order-card-header">
                  <div>
                    <div className="order-id">{order.orderId}</div>
                    <div className="order-date">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </div>
                <div className="order-items-row">
                  {order.items.map((item, i) => (
                    <img key={i} className="order-thumb" src={item.image} alt={item.name} title={item.name} onError={e => e.target.style.display = "none"} />
                  ))}
                </div>
                <div className="order-footer">
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""} · {PAYMENT_METHODS.find(p => p.id === order.paymentMethod)?.label}</div>
                    <div className="order-total">{fmt(order.total)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {order.customer?.city || "—"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}