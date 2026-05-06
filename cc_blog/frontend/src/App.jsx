import React, { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const API = "http://localhost:5000/api";

const CATEGORIES = ["Technology", "Lifestyle", "Travel", "Food", "Health", "Business", "Other"];

const CATEGORY_COLORS = {
  Technology: "#2563eb",
  Lifestyle: "#db2777",
  Travel: "#059669",
  Food: "#d97706",
  Health: "#7c3aed",
  Business: "#0891b2",
  Other: "#6b7280",
};

const emptyForm = {
  title: "",
  content: "",
  author: "",
  excerpt: "",
  category: "Technology",
  tags: "",
  coverImage: "",
  status: "draft",
};

// ── Dummy seed posts (shown when API is unavailable) ──────────────────────────
const SEED_POSTS = [
  {
    _id: "seed1",
    title: "Getting Started with the MERN Stack in 2025",
    author: "Arjun Mehta",
    excerpt: "A comprehensive guide to building modern full-stack applications using MongoDB, Express, React and Node.js — the definitive developer stack.",
    category: "Technology",
    status: "published",
    views: 1240,
    tags: ["mern", "react", "mongodb"],
    comments: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: "seed2",
    title: "The Art of Slow Travel: Finding Meaning on the Road",
    author: "Priya Nair",
    excerpt: "Why spending three months in one place beats rushing through ten countries in a week. A personal essay on depth over breadth.",
    category: "Travel",
    status: "published",
    views: 876,
    tags: ["travel", "lifestyle", "mindfulness"],
    comments: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: "seed3",
    title: "Fermented Foods & Gut Health: What the Science Says",
    author: "Dr. Sneha Iyer",
    excerpt: "Separating evidence-based findings from the hype around fermented foods — and what you should actually be eating for a healthy microbiome.",
    category: "Health",
    status: "draft",
    views: 412,
    tags: ["health", "nutrition", "science"],
    comments: [],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

// ── Utility ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const readTime = (text = "") => {
  const words = text.replace(/<[^>]+>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200)) + " min read";
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home"); // home | editor | detail | manage
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0 });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState({ author: "", content: "" });
  const [usingDummy, setUsingDummy] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterCat !== "All") params.set("category", filterCat);
      if (search) params.set("search", search);

      const res = await fetch(`${API}/posts?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
      setUsingDummy(false);
    } catch {
      setPosts(SEED_POSTS);
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCat, search]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/stats`);
      if (res.ok) setStats(await res.json());
    } catch {
      setStats({ total: 3, published: 2, drafts: 1, totalViews: 2528 });
    }
  };

  useEffect(() => { fetchPosts(); fetchStats(); }, [fetchPosts]);

  const flash = (msg, type = "success") => {
    if (type === "success") { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
    else { setError(msg); setTimeout(() => setError(""), 4000); }
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) {
      flash("Title, content, and author are required.", "error"); return;
    }
    try {
      const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API}/posts/${editingId}` : `${API}/posts`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      flash(editingId ? "Post updated!" : "Post created!");
      setForm(emptyForm); setEditingId(null); setView("manage");
      fetchPosts(); fetchStats();
    } catch {
      flash("Failed to save post.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await fetch(`${API}/posts/${id}`, { method: "DELETE" });
      flash("Post deleted.");
      setPosts((p) => p.filter((x) => x._id !== id));
      fetchStats();
      if (view === "detail") setView("home");
    } catch {
      flash("Failed to delete.", "error");
    }
  };

  const openDetail = async (post) => {
    try {
      const res = await fetch(`${API}/posts/${post._id}`);
      if (res.ok) setSelected(await res.json());
      else setSelected(post);
    } catch { setSelected(post); }
    setView("detail");
  };

  const startEdit = (post) => {
    setForm({
      title: post.title || "",
      content: post.content || "",
      author: post.author || "",
      excerpt: post.excerpt || "",
      category: post.category || "Technology",
      tags: (post.tags || []).join(", "),
      coverImage: post.coverImage || "",
      status: post.status || "draft",
    });
    setEditingId(post._id);
    setView("editor");
  };

  const submitComment = async () => {
    if (!comment.author.trim() || !comment.content.trim()) return;
    try {
      const res = await fetch(`${API}/posts/${selected._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });
      if (res.ok) {
        const newComment = await res.json();
        setSelected((p) => ({ ...p, comments: [...(p.comments || []), newComment] }));
        setComment({ author: "", content: "" });
      }
    } catch { flash("Failed to add comment.", "error"); }
  };

  // ── Filtered posts ─────────────────────────────────────────────────────────
  const displayed = posts.filter((p) => {
    const matchCat = filterCat === "All" || p.category === filterCat;
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf9f7; color: #1a1a1a; font-family: 'Source Serif 4', Georgia, serif; }
        ::selection { background: #1a1a1a; color: #faf9f7; }

        .nav { background: #faf9f7; border-bottom: 2px solid #1a1a1a; position: sticky; top: 0; z-index: 100; }
        .nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
        .nav-logo { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; letter-spacing: -1px; cursor: pointer; }
        .nav-logo span { color: #c8392b; }
        .nav-links { display: flex; gap: 4px; }
        .nav-btn { background: none; border: none; padding: 8px 14px; font-family: 'Source Serif 4', serif; font-size: 13px; letter-spacing: 0.8px; text-transform: uppercase; cursor: pointer; color: #666; transition: color 0.2s; }
        .nav-btn:hover, .nav-btn.active { color: #1a1a1a; }
        .nav-write { background: #1a1a1a; color: #faf9f7 !important; border-radius: 4px; }
        .nav-write:hover { background: #c8392b !important; color: #fff !important; }

        .banner { background: #1a1a1a; color: #faf9f7; text-align: center; padding: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
        .banner span { color: #c8392b; }

        .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

        /* ── Hero ── */
        .hero { border-bottom: 1px solid #e0ddd8; padding: 48px 0 40px; }
        .hero-grid { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .hero-eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #c8392b; font-weight: 600; margin-bottom: 14px; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 5vw, 54px); font-weight: 900; line-height: 1.05; letter-spacing: -1.5px; margin-bottom: 18px; }
        .hero-excerpt { font-size: 17px; color: #555; line-height: 1.7; font-style: italic; font-weight: 300; margin-bottom: 24px; }
        .hero-meta { display: flex; align-items: center; gap: 20px; font-size: 13px; color: #888; }
        .hero-meta strong { color: #1a1a1a; }
        .hero-dot { width: 3px; height: 3px; border-radius: 50%; background: #ccc; }
        .hero-sidebar-title { font-family: 'Playfair Display', serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 16px; }

        /* ── Stats bar ── */
        .stats-bar { background: #1a1a1a; color: #faf9f7; }
        .stats-inner { display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat-item { padding: 20px 24px; border-right: 1px solid #333; }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #fff; }
        .stat-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-top: 2px; }

        /* ── Filter bar ── */
        .filter-bar { padding: 20px 0; border-bottom: 1px solid #e0ddd8; display: flex; align-items: center; gap: 0; flex-wrap: wrap; }
        .filter-tag { background: none; border: 1px solid transparent; padding: 6px 16px; font-family: 'Source Serif 4', serif; font-size: 13px; cursor: pointer; color: #888; border-radius: 2px; transition: all 0.15s; }
        .filter-tag:hover { color: #1a1a1a; }
        .filter-tag.active { background: #1a1a1a; color: #faf9f7; border-color: #1a1a1a; }
        .search-wrap { margin-left: auto; }
        .search-input { border: 1.5px solid #e0ddd8; padding: 8px 14px; font-family: 'Source Serif 4', serif; font-size: 14px; background: #faf9f7; outline: none; width: 220px; border-radius: 2px; }
        .search-input:focus { border-color: #1a1a1a; }

        /* ── Post grid ── */
        .posts-section { padding: 40px 0; }
        .section-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 32px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; }
        .section-line { flex: 1; height: 1px; background: #1a1a1a; }

        .post-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .post-card { cursor: pointer; border-bottom: 1px solid #e0ddd8; padding-bottom: 28px; transition: opacity 0.2s; }
        .post-card:hover { opacity: 0.75; }
        .post-card-cat { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }
        .post-card-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; line-height: 1.2; letter-spacing: -0.3px; margin-bottom: 10px; }
        .post-card-excerpt { font-size: 14px; color: #666; line-height: 1.65; font-style: italic; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .post-card-meta { font-size: 12px; color: #aaa; display: flex; gap: 12px; align-items: center; }
        .post-card-meta strong { color: #555; }
        .draft-badge { background: #f59e0b; color: #fff; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; padding: 2px 8px; border-radius: 2px; font-weight: 700; }

        /* ── Detail ── */
        .detail-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
        .detail-back { font-size: 13px; color: #888; cursor: pointer; margin-bottom: 32px; display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
        .detail-back:hover { color: #c8392b; }
        .detail-cat { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; margin-bottom: 14px; }
        .detail-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 5vw, 46px); font-weight: 900; line-height: 1.08; letter-spacing: -1px; margin-bottom: 20px; }
        .detail-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #888; padding: 20px 0; border-top: 1px solid #e0ddd8; border-bottom: 1px solid #e0ddd8; margin-bottom: 36px; }
        .detail-meta strong { color: #1a1a1a; }
        .detail-content { font-size: 18px; line-height: 1.8; color: #2d2d2d; white-space: pre-wrap; font-weight: 300; }
        .detail-tags { margin-top: 36px; display: flex; flex-wrap: wrap; gap: 8px; }
        .tag-pill { border: 1px solid #e0ddd8; padding: 4px 12px; font-size: 12px; color: #888; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 2px; }
        .detail-actions { margin-top: 32px; display: flex; gap: 12px; padding-top: 24px; border-top: 1px solid #e0ddd8; }
        .btn-edit { background: #1a1a1a; color: #faf9f7; border: none; padding: 10px 22px; font-family: 'Source Serif 4', serif; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
        .btn-edit:hover { background: #c8392b; }
        .btn-del { background: none; color: #c8392b; border: 1.5px solid #c8392b; padding: 10px 22px; font-family: 'Source Serif 4', serif; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
        .btn-del:hover { background: #c8392b; color: #fff; }

        /* ── Comments ── */
        .comments-section { margin-top: 56px; padding-top: 32px; border-top: 2px solid #1a1a1a; }
        .comments-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
        .comment-item { padding: 18px 0; border-bottom: 1px solid #e0ddd8; }
        .comment-author { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; }
        .comment-body { font-size: 15px; color: #555; line-height: 1.65; }
        .comment-form { margin-top: 28px; }
        .cf-title { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; color: #888; }
        .cf-input { width: 100%; border: 1.5px solid #e0ddd8; padding: 10px 14px; font-family: 'Source Serif 4', serif; font-size: 14px; background: #faf9f7; outline: none; margin-bottom: 10px; border-radius: 2px; }
        .cf-input:focus { border-color: #1a1a1a; }
        .cf-textarea { width: 100%; border: 1.5px solid #e0ddd8; padding: 10px 14px; font-family: 'Source Serif 4', serif; font-size: 14px; background: #faf9f7; outline: none; resize: vertical; min-height: 90px; margin-bottom: 10px; border-radius: 2px; }
        .cf-textarea:focus { border-color: #1a1a1a; }
        .cf-submit { background: #1a1a1a; color: #faf9f7; border: none; padding: 10px 24px; font-family: 'Source Serif 4', serif; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
        .cf-submit:hover { background: #c8392b; }

        /* ── Editor ── */
        .editor-wrap { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
        .editor-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; margin-bottom: 32px; }
        .form-group { margin-bottom: 22px; }
        .form-label { display: block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 8px; font-weight: 600; }
        .form-input { width: 100%; border: 1.5px solid #e0ddd8; padding: 11px 14px; font-family: 'Source Serif 4', serif; font-size: 15px; background: #faf9f7; outline: none; border-radius: 2px; transition: border 0.2s; }
        .form-input:focus { border-color: #1a1a1a; }
        .form-textarea { width: 100%; border: 1.5px solid #e0ddd8; padding: 11px 14px; font-family: 'Source Serif 4', serif; font-size: 15px; background: #faf9f7; outline: none; resize: vertical; min-height: 240px; line-height: 1.7; border-radius: 2px; }
        .form-textarea:focus { border-color: #1a1a1a; }
        .form-select { width: 100%; border: 1.5px solid #e0ddd8; padding: 11px 14px; font-family: 'Source Serif 4', serif; font-size: 15px; background: #faf9f7; outline: none; border-radius: 2px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-actions { display: flex; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e0ddd8; }
        .btn-primary { background: #1a1a1a; color: #faf9f7; border: none; padding: 12px 28px; font-family: 'Source Serif 4', serif; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; }
        .btn-primary:hover { background: #c8392b; }
        .btn-secondary { background: none; color: #888; border: 1.5px solid #e0ddd8; padding: 12px 24px; font-family: 'Source Serif 4', serif; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
        .btn-secondary:hover { border-color: #1a1a1a; color: #1a1a1a; }

        /* ── Manage ── */
        .manage-wrap { padding: 40px 0 80px; }
        .manage-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .manage-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; }
        .table-wrap { background: #fff; border: 1px solid #e0ddd8; }
        .table-row { display: grid; grid-template-columns: 1fr 140px 100px 80px 80px 120px; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0ede8; font-size: 14px; gap: 12px; }
        .table-row:last-child { border-bottom: none; }
        .table-head { background: #1a1a1a; color: #faf9f7; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
        .table-title { font-weight: 600; cursor: pointer; }
        .table-title:hover { color: #c8392b; text-decoration: underline; }
        .table-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .tbl-edit { background: #f0f0f0; border: none; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .tbl-edit:hover { background: #1a1a1a; color: #fff; }
        .tbl-del { background: #fff1f0; border: none; padding: 5px 12px; font-size: 12px; cursor: pointer; color: #c8392b; font-family: inherit; }
        .tbl-del:hover { background: #c8392b; color: #fff; }

        /* ── Notifications ── */
        .toast { position: fixed; top: 80px; right: 24px; padding: 12px 20px; border-radius: 2px; font-size: 14px; z-index: 999; animation: slideIn 0.25s ease; letter-spacing: 0.3px; }
        .toast-success { background: #1a1a1a; color: #faf9f7; }
        .toast-error { background: #c8392b; color: #fff; }
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .dummy-notice { background: #fffbeb; border: 1px solid #fde68a; padding: 10px 16px; font-size: 13px; color: #92400e; margin-bottom: 24px; border-radius: 2px; }

        .empty-state { text-align: center; padding: 80px 0; color: #aaa; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-text { font-family: 'Playfair Display', serif; font-size: 20px; font-style: italic; }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-sidebar { display: none; }
          .post-grid { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: 1fr 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .table-row { grid-template-columns: 1fr 80px; }
          .table-row > *:not(:first-child):not(:last-child) { display: none; }
        }
      `}</style>

      {/* Toasts */}
      {success && <div className="toast toast-success">✓ {success}</div>}
      {error && <div className="toast toast-error">✕ {error}</div>}

      {/* Top Banner */}
      <div className="banner">
        MERN Blog Platform &nbsp;·&nbsp; <span>Full-Stack</span> &nbsp;·&nbsp; React + Express + MongoDB
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => setView("home")}>
            The<span>Ink</span>
          </div>
          <div className="nav-links">
            <button className={`nav-btn ${view === "home" ? "active" : ""}`} onClick={() => setView("home")}>Home</button>
            <button className={`nav-btn ${view === "manage" ? "active" : ""}`} onClick={() => setView("manage")}>Manage</button>
            <button
              className="nav-btn nav-write"
              onClick={() => { setForm(emptyForm); setEditingId(null); setView("editor"); }}
            >+ Write</button>
          </div>
        </div>
      </nav>

      {/* ── HOME ─────────────────────────────────────────────────────── */}
      {view === "home" && (
        <>
          {/* Hero — first published post */}
          {(() => {
            const hero = posts.find((p) => p.status === "published") || posts[0];
            if (!hero) return null;
            const sidebarPosts = posts.filter((p) => p._id !== hero._id).slice(0, 4);
            return (
              <div className="hero">
                <div className="container">
                  <div className="hero-grid">
                    <div>
                      <div className="hero-eyebrow">{hero.category} · Featured</div>
                      <h1 className="hero-title" style={{ cursor: "pointer" }} onClick={() => openDetail(hero)}>
                        {hero.title}
                      </h1>
                      <p className="hero-excerpt">{hero.excerpt || hero.title}</p>
                      <div className="hero-meta">
                        <strong>{hero.author}</strong>
                        <span className="hero-dot" />
                        <span>{fmt(hero.createdAt)}</span>
                        <span className="hero-dot" />
                        <span>{hero.views} views</span>
                      </div>
                    </div>
                    <div className="hero-sidebar">
                      <div className="hero-sidebar-title">Latest Stories</div>
                      {sidebarPosts.map((p) => (
                        <div key={p._id} style={{ padding: "14px 0", borderBottom: "1px solid #e0ddd8", cursor: "pointer" }} onClick={() => openDetail(p)}>
                          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: CATEGORY_COLORS[p.category] || "#888", marginBottom: 5, fontWeight: 700 }}>{p.category}</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>{fmt(p.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Stats */}
          <div className="stats-bar">
            <div className="container">
              <div className="stats-inner">
                {[
                  { num: stats.total, label: "Total Posts" },
                  { num: stats.published, label: "Published" },
                  { num: stats.drafts, label: "Drafts" },
                  { num: stats.totalViews, label: "Total Views" },
                ].map((s) => (
                  <div className="stat-item" key={s.label}>
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="container">
            <div className="filter-bar">
              {["All", ...CATEGORIES].map((c) => (
                <button key={c} className={`filter-tag ${filterCat === c ? "active" : ""}`} onClick={() => setFilterCat(c)}>{c}</button>
              ))}
              <div className="search-wrap">
                <input className="search-input" placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="container">
            <div className="posts-section">
              {usingDummy && (
                <div className="dummy-notice">📡 Backend offline — showing sample posts. Start your server and connect MongoDB to see live data.</div>
              )}
              <div className="section-head">
                <span className="section-title">All Stories</span>
                <div className="section-line" />
                <span style={{ fontSize: 13, color: "#aaa" }}>{displayed.length} post{displayed.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-text">Loading stories…</div></div>
              ) : displayed.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📖</div>
                  <div className="empty-text">No stories found. Write the first one!</div>
                </div>
              ) : (
                <div className="post-grid">
                  {displayed.map((post) => (
                    <div className="post-card" key={post._id} onClick={() => openDetail(post)}>
                      <div className="post-card-cat" style={{ color: CATEGORY_COLORS[post.category] || "#888" }}>
                        {post.category}
                        {post.status === "draft" && <span className="draft-badge" style={{ marginLeft: 8 }}>Draft</span>}
                      </div>
                      <h2 className="post-card-title">{post.title}</h2>
                      <p className="post-card-excerpt">{post.excerpt || post.title}</p>
                      <div className="post-card-meta">
                        <strong>{post.author}</strong>
                        <span>{fmt(post.createdAt)}</span>
                        <span>👁 {post.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL ───────────────────────────────────────────────────── */}
      {view === "detail" && selected && (
        <div className="detail-wrap">
          <div className="detail-back" onClick={() => setView("home")}>← Back to Home</div>
          <div className="detail-cat" style={{ color: CATEGORY_COLORS[selected.category] || "#888" }}>
            {selected.category}
            {selected.status === "draft" && <span className="draft-badge" style={{ marginLeft: 10 }}>Draft</span>}
          </div>
          <h1 className="detail-title">{selected.title}</h1>
          <div className="detail-meta">
            <span>By <strong>{selected.author}</strong></span>
            <span>{fmt(selected.createdAt)}</span>
            <span>{readTime(selected.content)}</span>
            <span>👁 {selected.views} views</span>
            <span>💬 {(selected.comments || []).length} comments</span>
          </div>
          {selected.excerpt && (
            <p style={{ fontSize: 18, fontStyle: "italic", color: "#777", lineHeight: 1.7, marginBottom: 28, fontWeight: 300 }}>{selected.excerpt}</p>
          )}
          <div className="detail-content">{selected.content}</div>
          {selected.tags?.length > 0 && (
            <div className="detail-tags">
              {selected.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
            </div>
          )}
          <div className="detail-actions">
            <button className="btn-edit" onClick={() => startEdit(selected)}>Edit Post</button>
            <button className="btn-del" onClick={() => handleDelete(selected._id)}>Delete</button>
          </div>

          {/* Comments */}
          <div className="comments-section">
            <div className="comments-title">
              {(selected.comments || []).length} Comment{(selected.comments || []).length !== 1 ? "s" : ""}
            </div>
            {(selected.comments || []).map((c) => (
              <div className="comment-item" key={c._id}>
                <div className="comment-author">{c.author}</div>
                <div className="comment-body">{c.content}</div>
              </div>
            ))}
            <div className="comment-form">
              <div className="cf-title">Leave a comment</div>
              <input className="cf-input" placeholder="Your name" value={comment.author} onChange={(e) => setComment({ ...comment, author: e.target.value })} />
              <textarea className="cf-textarea" placeholder="Your thoughts..." value={comment.content} onChange={(e) => setComment({ ...comment, content: e.target.value })} />
              <button className="cf-submit" onClick={submitComment}>Post Comment</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITOR ───────────────────────────────────────────────────── */}
      {view === "editor" && (
        <div className="editor-wrap">
          <div className="editor-title">{editingId ? "Edit Story" : "Write a New Story"}</div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Your headline here…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Excerpt</label>
            <input className="form-input" placeholder="Brief summary (auto-generated if empty)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea className="form-textarea" placeholder="Write your story here…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Author *</label>
              <input className="form-input" placeholder="Your name" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" placeholder="react, nodejs, web" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Cover Image URL</label>
            <input className="form-input" placeholder="https://example.com/image.jpg" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>{editingId ? "Update Story" : "Publish Story"}</button>
            <button className="btn-secondary" onClick={() => { setForm(emptyForm); setEditingId(null); setView("home"); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── MANAGE ───────────────────────────────────────────────────── */}
      {view === "manage" && (
        <div className="container">
          <div className="manage-wrap">
            <div className="manage-header">
              <div className="manage-title">Manage Posts</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "published", "draft"].map((s) => (
                  <button key={s} className={`filter-tag ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)} style={{ textTransform: "capitalize" }}>{s === "all" ? "All" : s}</button>
                ))}
              </div>
            </div>

            {usingDummy && (
              <div className="dummy-notice">📡 Showing sample data — connect your backend to manage real posts.</div>
            )}

            <div className="table-wrap">
              <div className="table-row table-head">
                <span>Title</span>
                <span>Author</span>
                <span>Category</span>
                <span>Views</span>
                <span>Status</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>
              {posts
                .filter((p) => filterStatus === "all" || p.status === filterStatus)
                .map((post) => (
                  <div className="table-row" key={post._id}>
                    <span className="table-title" onClick={() => openDetail(post)}>{post.title}</span>
                    <span style={{ fontSize: 13, color: "#666" }}>{post.author}</span>
                    <span style={{ fontSize: 12, color: CATEGORY_COLORS[post.category] || "#888", fontWeight: 600 }}>{post.category}</span>
                    <span style={{ fontSize: 13, color: "#888" }}>{post.views}</span>
                    <span>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: post.status === "published" ? "#059669" : "#d97706" }}>
                        {post.status}
                      </span>
                    </span>
                    <div className="table-actions">
                      <button className="tbl-edit" onClick={() => startEdit(post)}>Edit</button>
                      <button className="tbl-del" onClick={() => handleDelete(post._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              {posts.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#aaa", fontStyle: "italic" }}>No posts yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
