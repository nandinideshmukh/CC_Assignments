import React, { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const API = "https://ccbackend-gmbadxdub9hub3be.centralindia-01.azurewebsites.net/api";
// curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics",
  "Mechanical", "Civil", "Business Administration",
  "Mathematics", "Physics", "Other",
];

const DEPT_SHORT = {
  "Computer Science": "CS", "Information Technology": "IT",
  "Electronics": "ECE", "Mechanical": "ME", "Civil": "CE",
  "Business Administration": "MBA", "Mathematics": "MATH",
  "Physics": "PHY", "Other": "OTH",
};

const DEPT_COLOR = {
  "Computer Science": "#6366f1", "Information Technology": "#0ea5e9",
  "Electronics": "#f59e0b", "Mechanical": "#ef4444",
  "Civil": "#84cc16", "Business Administration": "#8b5cf6",
  "Mathematics": "#06b6d4", "Physics": "#f97316", "Other": "#6b7280",
};

const STATUS_CFG = {
  active:    { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Active" },
  inactive:  { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: "Inactive" },
  graduated: { color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Graduated" },
  suspended: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Suspended" },
};

const emptyForm = {
  firstName: "", lastName: "", email: "", phone: "",
  department: "Computer Science", year: "1", semester: "1",
  gpa: "0", status: "active", address: "", dateOfBirth: "",
};

const SEED = [
  { _id: "s1", studentId: "STU0001", firstName: "Aarav", lastName: "Sharma",
    email: "aarav.sharma@college.edu", phone: "9876543210",
    department: "Computer Science", year: 2, semester: 3, gpa: 8.7,
    status: "active", address: "Pune, MH", createdAt: new Date().toISOString() },
  { _id: "s2", studentId: "STU0002", firstName: "Priya", lastName: "Patel",
    email: "priya.patel@college.edu", phone: "9123456789",
    department: "Information Technology", year: 3, semester: 5, gpa: 9.1,
    status: "active", address: "Mumbai, MH", createdAt: new Date().toISOString() },
  { _id: "s3", studentId: "STU0003", firstName: "Rahul", lastName: "Nair",
    email: "rahul.nair@college.edu", phone: "9988776655",
    department: "Electronics", year: 4, semester: 7, gpa: 7.4,
    status: "graduated", address: "Nashik, MH", createdAt: new Date().toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (f, l) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function App() {
  const [students, setStudents]   = useState([]);
  const [stats, setStats]         = useState({ total: 0, active: 0, graduated: 0, avgGpa: "0.00" });
  const [form, setForm]           = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [view, setView]           = useState("list"); // list | form | detail
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState("");
  const [filterDept, setFilterDept]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dummy, setDummy]         = useState(false);
  const [errors, setErrors]       = useState({});

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDept !== "All")   params.set("department", filterDept);
      if (filterStatus !== "All") params.set("status", filterStatus.toLowerCase());
      if (search) params.set("search", search);
      const res = await fetch(`${API}/students?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStudents(data.students || []);
      setDummy(false);
    } catch {
      setStudents(SEED);
      setDummy(true);
    } finally { setLoading(false); }
  }, [filterDept, filterStatus, search]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/stats`);
      if (res.ok) setStats(await res.json());
      else setStats({ total: 3, active: 2, graduated: 1, avgGpa: "8.40" });
    } catch { setStats({ total: 3, active: 2, graduated: 1, avgGpa: "8.40" }); }
  };

  useEffect(() => { fetchStudents(); fetchStats(); }, [fetchStudents]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email.trim())     e.email     = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.department)       e.department = "Required";
    if (!form.year)             e.year = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        semester: parseInt(form.semester),
        gpa: parseFloat(form.gpa),
      };
      const method = editingId ? "PUT" : "POST";
      const url    = editingId ? `${API}/students/${editingId}` : `${API}/students`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      showToast(editingId ? "Student updated!" : "Student added!");
      setForm(emptyForm); setEditingId(null); setView("list");
      fetchStudents(); fetchStats();
    } catch (err) { showToast(err.message || "Failed to save.", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this student record permanently?")) return;
    try {
      await fetch(`${API}/students/${id}`, { method: "DELETE" });
      showToast("Student removed.");
      setStudents((p) => p.filter((s) => s._id !== id));
      fetchStats();
      if (view === "detail") setView("list");
    } catch { showToast("Delete failed.", "error"); }
  };

  const startEdit = (student) => {
    setForm({
      firstName:  student.firstName  || "",
      lastName:   student.lastName   || "",
      email:      student.email      || "",
      phone:      student.phone      || "",
      department: student.department || "Computer Science",
      year:       String(student.year     || 1),
      semester:   String(student.semester || 1),
      gpa:        String(student.gpa      || 0),
      status:     student.status     || "active",
      address:    student.address    || "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
    });
    setEditingId(student._id);
    setErrors({});
    setView("form");
  };

  const openDetail = (s) => { setSelected(s); setView("detail"); };

  const f = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: "" })); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0d1117;
          --surface: #161b22;
          --border:  #21262d;
          --border2: #30363d;
          --text:    #e6edf3;
          --muted:   #7d8590;
          --accent:  #58a6ff;
          --accent2: #388bfd;
          --danger:  #f85149;
          --success: #3fb950;
          --warn:    #d29922;
          --font:    'DM Sans', sans-serif;
          --mono:    'DM Mono', monospace;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }
        ::selection { background: rgba(88,166,255,0.25); }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

        /* ── Layout ── */
        .shell { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          width: 220px; flex-shrink: 0; background: var(--surface);
          border-right: 1px solid var(--border); padding: 24px 0;
          display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh;
        }
        .logo {
          padding: 0 20px 24px; border-bottom: 1px solid var(--border);
          font-size: 17px; font-weight: 700; letter-spacing: -0.4px;
        }
        .logo span { color: var(--accent); }
        .logo-sub { font-size: 11px; color: var(--muted); margin-top: 2px; font-weight: 400; }
        .nav-section { padding: 16px 12px 8px; }
        .nav-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); padding: 0 8px; margin-bottom: 6px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 8px 10px;
          border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--muted);
          cursor: pointer; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left;
        }
        .nav-item:hover { background: rgba(88,166,255,0.08); color: var(--text); }
        .nav-item.active { background: rgba(88,166,255,0.15); color: var(--accent); }
        .nav-icon { font-size: 15px; width: 20px; text-align: center; }
        .sidebar-footer { margin-top: auto; padding: 16px 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }

        /* ── Main ── */
        .main { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
        .topbar {
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 14px 28px; display: flex; align-items: center; gap: 12;
          justify-content: space-between; position: sticky; top: 0; z-index: 50;
        }
        .topbar-title { font-size: 15px; font-weight: 600; }
        .topbar-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
        .topbar-right { display: flex; gap: 10px; align-items: center; }

        /* ── Buttons ── */
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 6px; font-family: var(--font); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .btn-primary { background: var(--accent2); color: #fff; border-color: var(--accent); }
        .btn-primary:hover { background: var(--accent); }
        .btn-ghost { background: transparent; color: var(--muted); border-color: var(--border2); }
        .btn-ghost:hover { color: var(--text); border-color: var(--border2); background: var(--border); }
        .btn-danger { background: transparent; color: var(--danger); border-color: rgba(248,81,73,0.4); }
        .btn-danger:hover { background: rgba(248,81,73,0.1); }
        .btn-sm { padding: 5px 10px; font-size: 12px; }

        /* ── Content ── */
        .content { padding: 28px; flex: 1; }

        /* ── Stats ── */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; }
        .stat-val { font-size: 28px; font-weight: 700; font-family: var(--mono); line-height: 1; }
        .stat-label { font-size: 12px; color: var(--muted); margin-top: 5px; }
        .stat-bar { height: 2px; background: var(--border); margin-top: 12px; border-radius: 1px; overflow: hidden; }
        .stat-fill { height: 100%; border-radius: 1px; }

        /* ── Toolbar ── */
        .toolbar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border2); border-radius: 6px; padding: 7px 12px; flex: 1; min-width: 200px; max-width: 320px; }
        .search-box input { background: none; border: none; outline: none; color: var(--text); font-family: var(--font); font-size: 13px; width: 100%; }
        .search-box input::placeholder { color: var(--muted); }
        .filter-select { background: var(--surface); border: 1px solid var(--border2); color: var(--text); padding: 7px 10px; border-radius: 6px; font-family: var(--font); font-size: 13px; outline: none; cursor: pointer; }

        /* ── Table ── */
        .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: rgba(255,255,255,0.03); padding: 10px 16px; text-align: left; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); font-weight: 500; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .table td { padding: 13px 16px; font-size: 13px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .table tr:last-child td { border-bottom: none; }
        .table tr:hover td { background: rgba(255,255,255,0.02); }

        /* ── Avatar ── */
        .avatar { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .student-name-cell { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .student-name-cell:hover .sname { color: var(--accent); text-decoration: underline; }
        .sname { font-weight: 600; font-size: 13px; }
        .sid { font-size: 11px; color: var(--muted); font-family: var(--mono); }

        /* ── Badges ── */
        .badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
        .dept-badge { font-size: 11px; font-weight: 600; font-family: var(--mono); }
        .gpa-chip { font-family: var(--mono); font-size: 13px; font-weight: 500; }

        /* ── Empty ── */
        .empty { padding: 64px 0; text-align: center; color: var(--muted); }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .empty-text { font-size: 15px; }

        /* ── Form ── */
        .form-wrap { max-width: 740px; }
        .form-header { margin-bottom: 28px; }
        .form-title { font-size: 20px; font-weight: 700; }
        .form-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
        .form-section { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 22px; margin-bottom: 16px; }
        .form-section-title { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; font-weight: 600; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 12px; font-weight: 500; color: var(--muted); }
        .form-input { background: var(--bg); border: 1px solid var(--border2); color: var(--text); padding: 9px 12px; border-radius: 6px; font-family: var(--font); font-size: 13px; outline: none; transition: border 0.15s; }
        .form-input:focus { border-color: var(--accent); }
        .form-input.err { border-color: var(--danger); }
        .form-err { font-size: 11px; color: var(--danger); }
        .form-select { background: var(--bg); border: 1px solid var(--border2); color: var(--text); padding: 9px 12px; border-radius: 6px; font-family: var(--font); font-size: 13px; outline: none; }
        .form-select:focus { border-color: var(--accent); }
        .form-actions { display: flex; gap: 10px; margin-top: 20px; }

        /* ── Detail ── */
        .detail-wrap { max-width: 700px; }
        .detail-header { display: flex; align-items: flex-start; gap: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 24px; margin-bottom: 16px; }
        .detail-avatar { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
        .detail-name { font-size: 22px; font-weight: 700; }
        .detail-id { font-family: var(--mono); font-size: 13px; color: var(--muted); margin-top: 3px; }
        .detail-badges { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .detail-actions { margin-left: auto; display: flex; gap: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; }
        .info-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
        .info-value { font-size: 14px; font-weight: 500; }
        .info-value.mono { font-family: var(--mono); }

        /* ── Toast ── */
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 9999; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); animation: toastIn 0.25s ease; }
        .toast-success { background: #1a2e1a; border: 1px solid var(--success); color: var(--success); }
        .toast-error { background: #2e1a1a; border: 1px solid var(--danger); color: var(--danger); }
        @keyframes toastIn { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .dummy-banner { background: rgba(210,153,34,0.1); border: 1px solid rgba(210,153,34,0.3); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--warn); margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .sidebar { display: none; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .info-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .stats-grid { grid-template-columns: 1fr; }
          .content { padding: 16px; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <div className="shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="logo">
            <div>Acad<span>Pro</span></div>
            <div className="logo-sub">Student Records System</div>
          </div>
          <div className="nav-section">
            <div className="nav-label">Menu</div>
            <button className={`nav-item ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
              <span className="nav-icon">🗂</span> All Students
            </button>
            <button className={`nav-item ${view === "form" && !editingId ? "active" : ""}`}
              onClick={() => { setForm(emptyForm); setEditingId(null); setErrors({}); setView("form"); }}>
              <span className="nav-icon">➕</span> Add Student
            </button>
          </div>
          <div className="sidebar-footer">
            <div style={{ fontFamily: "var(--mono)", fontSize: 11 }}>v1.0.0 · MERN Stack</div>
            <div style={{ marginTop: 4 }}>MongoDB + Express + React</div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="topbar-title">
                {view === "list" ? "Student Directory"
                  : view === "form" ? (editingId ? "Edit Student" : "Add Student")
                  : "Student Profile"}
              </div>
              <div className="topbar-sub">
                {view === "list" ? `${students.length} record${students.length !== 1 ? "s" : ""} found`
                  : view === "form" ? "Fill in student details below"
                  : selected ? `${selected.firstName} ${selected.lastName}` : ""}
              </div>
            </div>
            <div className="topbar-right">
              {view !== "list" && (
                <button className="btn btn-ghost" onClick={() => setView("list")}>← Back</button>
              )}
              {view === "list" && (
                <button className="btn btn-primary"
                  onClick={() => { setForm(emptyForm); setEditingId(null); setErrors({}); setView("form"); }}>
                  + Add Student
                </button>
              )}
            </div>
          </div>

          <div className="content">
            {/* ── LIST VIEW ── */}
            {view === "list" && (
              <>
                {/* Stats */}
                <div className="stats-grid">
                  {[
                    { label: "Total Students", val: stats.total, color: "#58a6ff", pct: 100 },
                    { label: "Active",          val: stats.active, color: "#3fb950", pct: stats.total ? (stats.active/stats.total*100) : 0 },
                    { label: "Graduated",       val: stats.graduated, color: "#a371f7", pct: stats.total ? (stats.graduated/stats.total*100) : 0 },
                    { label: "Avg GPA",         val: stats.avgGpa, color: "#d29922", pct: (parseFloat(stats.avgGpa) / 10 * 100) },
                  ].map((s) => (
                    <div className="stat-card" key={s.label}>
                      <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {dummy && (
                  <div className="dummy-banner">
                    ⚠ Backend offline — showing sample records. Start server &amp; connect MongoDB to manage real data.
                  </div>
                )}

                {/* Toolbar */}
                <div className="toolbar">
                  <div className="search-box">
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>🔍</span>
                    <input placeholder="Search by name, email, ID…" value={search}
                      onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                {/* Table */}
                <div className="table-wrap">
                  {loading ? (
                    <div className="empty"><div className="empty-icon">⏳</div><div className="empty-text">Loading records…</div></div>
                  ) : students.length === 0 ? (
                    <div className="empty"><div className="empty-icon">🎓</div><div className="empty-text">No students found. Add one!</div></div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Department</th>
                          <th>Year / Sem</th>
                          <th>GPA</th>
                          <th>Status</th>
                          <th>Enrolled</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const sc = STATUS_CFG[s.status] || STATUS_CFG.inactive;
                          const dc = DEPT_COLOR[s.department] || "#6b7280";
                          return (
                            <tr key={s._id}>
                              <td>
                                <div className="student-name-cell" onClick={() => openDetail(s)}>
                                  <div className="avatar" style={{ background: `${dc}20`, color: dc }}>
                                    {initials(s.firstName, s.lastName)}
                                  </div>
                                  <div>
                                    <div className="sname">{s.firstName} {s.lastName}</div>
                                    <div className="sid">{s.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="dept-badge" style={{ color: dc }}>
                                  {DEPT_SHORT[s.department] || "—"}
                                </span>
                              </td>
                              <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>
                                Y{s.year} / S{s.semester}
                              </td>
                              <td>
                                <span className="gpa-chip" style={{ color: s.gpa >= 8 ? "var(--success)" : s.gpa >= 6 ? "var(--warn)" : "var(--danger)" }}>
                                  {Number(s.gpa).toFixed(1)}
                                </span>
                              </td>
                              <td>
                                <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                                  {sc.label}
                                </span>
                              </td>
                              <td style={{ color: "var(--muted)", fontSize: 12 }}>
                                {fmt(s.enrollmentDate || s.createdAt)}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>Edit</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>Del</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ── FORM VIEW ── */}
            {view === "form" && (
              <div className="form-wrap">
                <div className="form-header">
                  <div className="form-title">{editingId ? "Edit Student Record" : "Register New Student"}</div>
                  <div className="form-sub">{editingId ? "Update the student's information below." : "Fill in all required fields to add a new student."}</div>
                </div>

                {/* Personal Info */}
                <div className="form-section">
                  <div className="form-section-title">Personal Information</div>
                  <div className="form-grid">
                    {[
                      { key: "firstName", label: "First Name *", placeholder: "Aarav" },
                      { key: "lastName",  label: "Last Name *",  placeholder: "Sharma" },
                      { key: "email",     label: "Email Address *", placeholder: "student@college.edu" },
                      { key: "phone",     label: "Phone Number",  placeholder: "9876543210" },
                      { key: "dateOfBirth", label: "Date of Birth", placeholder: "", type: "date" },
                      { key: "address",   label: "Address", placeholder: "City, State", full: true },
                    ].map(({ key, label, placeholder, type, full }) => (
                      <div className={`form-group${full ? " full" : ""}`} key={key}>
                        <label className="form-label">{label}</label>
                        <input type={type || "text"} className={`form-input${errors[key] ? " err" : ""}`}
                          placeholder={placeholder} value={form[key]} onChange={f(key)} />
                        {errors[key] && <span className="form-err">{errors[key]}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic Info */}
                <div className="form-section">
                  <div className="form-section-title">Academic Details</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Department *</label>
                      <select className={`form-select${errors.department ? " err" : ""}`} value={form.department} onChange={f("department")}>
                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                      {errors.department && <span className="form-err">{errors.department}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status} onChange={f("status")}>
                        {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year *</label>
                      <select className={`form-select${errors.year ? " err" : ""}`} value={form.year} onChange={f("year")}>
                        {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select className="form-select" value={form.semester} onChange={f("semester")}>
                        {[1,2,3,4,5,6,7,8,9,10].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">GPA (0–10)</label>
                      <input type="number" className="form-input" min="0" max="10" step="0.1"
                        value={form.gpa} onChange={f("gpa")} />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSubmit}>
                    {editingId ? "💾 Update Student" : "✓ Register Student"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setForm(emptyForm); setEditingId(null); setView("list"); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── DETAIL VIEW ── */}
            {view === "detail" && selected && (() => {
              const sc = STATUS_CFG[selected.status] || STATUS_CFG.inactive;
              const dc = DEPT_COLOR[selected.department] || "#6b7280";
              return (
                <div className="detail-wrap">
                  <div className="detail-header">
                    <div className="detail-avatar" style={{ background: `${dc}20`, color: dc }}>
                      {initials(selected.firstName, selected.lastName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="detail-name">{selected.firstName} {selected.lastName}</div>
                      <div className="detail-id">{selected.studentId}</div>
                      <div className="detail-badges">
                        <span className="badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        <span className="badge" style={{ background: `${dc}15`, color: dc }}>{selected.department}</span>
                        <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted)" }}>
                          Year {selected.year} · Sem {selected.semester}
                        </span>
                      </div>
                    </div>
                    <div className="detail-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(selected)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected._id)}>Delete</button>
                    </div>
                  </div>

                  <div className="info-grid">
                    {[
                      { label: "Email",       value: selected.email,      mono: true },
                      { label: "Phone",       value: selected.phone || "—" },
                      { label: "GPA",         value: Number(selected.gpa || 0).toFixed(2), mono: true },
                      { label: "Department",  value: selected.department },
                      { label: "Address",     value: selected.address || "—" },
                      { label: "Date of Birth", value: selected.dateOfBirth ? fmt(selected.dateOfBirth) : "—" },
                      { label: "Enrolled On", value: fmt(selected.enrollmentDate || selected.createdAt) },
                      { label: "Last Updated", value: fmt(selected.updatedAt) },
                    ].map(({ label, value, mono }) => (
                      <div className="info-card" key={label}>
                        <div className="info-label">{label}</div>
                        <div className={`info-value${mono ? " mono" : ""}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}