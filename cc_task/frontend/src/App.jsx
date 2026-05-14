import React, { useState, useEffect } from "react";

const API = "https://ccbackend-gmbadxdub9hub3be.centralindia-01.azurewebsites.net/api/tasks";

const STATUS_COLORS = {
  todo: { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" },
  "in-progress": { bg: "#eff6ff", text: "#3b82f6", dot: "#3b82f6" },
  done: { bg: "#f0fdf4", text: "#22c55e", dot: "#22c55e" },
};

const PRIORITY_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

const emptyForm = { title: "", description: "", status: "todo", priority: "medium" };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // ── Fetch all tasks ──────────────────────────────────────────────
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setTasks(data);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // ── Submit (create or update) ────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError("");
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API}/${editingId}` : API;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      await fetchTasks();
      resetForm();
    } catch {
      setError("Failed to save task.");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      setError("Failed to delete task.");
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────
  const startEdit = (task) => {
    setForm({ title: task.title, description: task.description, status: task.status, priority: task.priority });
    setEditingId(task._id);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = filterStatus === "all" ? tasks : tasks.filter((t) => t.status === filterStatus);

  // ── Styles ───────────────────────────────────────────────────────
  const s = {
    app: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#0f172a" },
    header: { background: "#0f172a", color: "#fff", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    headerTitle: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 },
    headerSub: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
    addBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
    body: { maxWidth: 800, margin: "0 auto", padding: "28px 16px" },
    card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 20 },
    label: { display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" },
    input: { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
    textarea: { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", minHeight: 72, boxSizing: "border-box" },
    select: { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff", outline: "none" },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 },
    formActions: { display: "flex", gap: 10, marginTop: 20 },
    saveBtn: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", flex: 1 },
    cancelBtn: { background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
    filters: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    filterBtn: (active) => ({ background: active ? "#0f172a" : "#fff", color: active ? "#fff" : "#64748b", border: "1.5px solid", borderColor: active ? "#0f172a" : "#e2e8f0", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }),
    taskCard: { background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 16, transition: "box-shadow 0.2s" },
    taskMeta: { flex: 1 },
    taskTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 4px" },
    taskDesc: { fontSize: 13, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 },
    badges: { display: "flex", gap: 8, flexWrap: "wrap" },
    statusBadge: (s) => ({ background: STATUS_COLORS[s]?.bg, color: STATUS_COLORS[s]?.text, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }),
    priorityDot: (p) => ({ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[p], display: "inline-block", marginRight: 4 }),
    priorityBadge: (p) => ({ display: "flex", alignItems: "center", fontSize: 12, color: "#64748b", fontWeight: 500 }),
    taskActions: { display: "flex", gap: 8 },
    editBtn: { background: "#eff6ff", color: "#3b82f6", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    delBtn: { background: "#fff1f2", color: "#ef4444", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    error: { background: "#fff1f2", color: "#ef4444", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
    empty: { textAlign: "center", color: "#94a3b8", padding: "48px 0", fontSize: 15 },
    stats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 },
    statCard: (color) => ({ background: "#fff", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }),
    statNum: { fontSize: 26, fontWeight: 700, lineHeight: 1 },
    statLabel: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  };

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgCount = tasks.filter((t) => t.status === "in-progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div style={s.app}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.headerTitle}>⚡ TaskFlow</p>
          <p style={s.headerSub}>{tasks.length} task{tasks.length !== 1 ? "s" : ""} total</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setError(""); }}>
          {showForm && !editingId ? "✕ Close" : "+ New Task"}
        </button>
      </div>

      <div style={s.body}>
        {/* Error */}
        {error && <div style={s.error}>⚠ {error}</div>}

        {/* Form */}
        {showForm && (
          <div style={s.card}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>
              {editingId ? "✏️ Edit Task" : "✨ New Task"}
            </div>
            <div>
              <label style={s.label}>Title *</label>
              <input style={s.input} value={form.title} placeholder="What needs to be done?" onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} placeholder="Add details..." onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Status</label>
                <select style={s.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Priority</label>
                <select style={s.select} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={s.formActions}>
              <button style={s.saveBtn} onClick={handleSubmit}>{editingId ? "Update Task" : "Create Task"}</button>
              <button style={s.cancelBtn} onClick={resetForm}>Cancel</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={s.stats}>
          <div style={s.statCard("#94a3b8")}><div style={s.statNum}>{todoCount}</div><div style={s.statLabel}>To Do</div></div>
          <div style={s.statCard("#3b82f6")}><div style={s.statNum}>{inProgCount}</div><div style={s.statLabel}>In Progress</div></div>
          <div style={s.statCard("#22c55e")}><div style={s.statNum}>{doneCount}</div><div style={s.statLabel}>Done</div></div>
        </div>

        {/* Filters */}
        <div style={s.filters}>
          {["all", "todo", "in-progress", "done"].map((f) => (
            <button key={f} style={s.filterBtn(filterStatus === f)} onClick={() => setFilterStatus(f)}>
              {f === "all" ? "All Tasks" : f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div style={s.empty}>Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            No tasks found. {filterStatus !== "all" ? "Try a different filter." : "Create your first task!"}
          </div>
        ) : (
          filtered.map((task) => (
            <div key={task._id} style={s.taskCard}>
              <div style={s.taskMeta}>
                <p style={s.taskTitle}>{task.title}</p>
                {task.description && <p style={s.taskDesc}>{task.description}</p>}
                <div style={s.badges}>
                  <span style={s.statusBadge(task.status)}>
                    {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                  <span style={s.priorityBadge(task.priority)}>
                    <span style={s.priorityDot(task.priority)} />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </div>
              <div style={s.taskActions}>
                <button style={s.editBtn} onClick={() => startEdit(task)}>Edit</button>
                <button style={s.delBtn} onClick={() => handleDelete(task._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}