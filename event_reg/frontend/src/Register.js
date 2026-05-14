import React, { useState } from "react";
import axios from "axios";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", event: "" });
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://ccbackend-gmbadxdub9hub3be.centralindia-01.azurewebsites.net/api/register", form);
      showToast("Registration successful!", "success");
      setForm({ name: "", email: "", phone: "", event: "" });
    } catch {
      showToast("Error submitting form", "error");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://ccbackend-gmbadxdub9hub3be.centralindia-01.azurewebsites.net/api/register");
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const uniqueEvents = new Set(users.map((u) => u.event)).size;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.h1}>Event registration</h1>
        <p style={styles.subtext}>Fill in your details to register for an upcoming event</p>
      </div>

      {/* Form Card */}
      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full name</label>
              <input
                name="name"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone number</label>
              <input
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Email address</label>
              <input
                name="email"
                type="email"
                placeholder="ada@example.com"
                value={form.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Event name</label>
              <input
                name="event"
                placeholder="e.g. Tech Summit 2026"
                value={form.event}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.btnRow}>
            <button type="submit" style={styles.btnPrimary}>Register</button>
            <button type="button" onClick={() => setForm({ name: "", email: "", phone: "", event: "" })} style={styles.btnSecondary}>Clear</button>
            {toast.msg && (
              <span style={toast.type === "success" ? styles.toastSuccess : styles.toastError}>
                {toast.msg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Divider */}
      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>Registrations</span>
        <div style={styles.dividerLine} />
      </div>

      {/* Stats */}
      {users.length > 0 && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total</div>
            <div style={styles.statValue}>{users.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Events</div>
            <div style={styles.statValue}>{uniqueEvents}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Latest</div>
            <div style={{ ...styles.statValue, fontSize: "14px", marginTop: "4px" }}>
              {users[users.length - 1].name.split(" ")[0]}
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div style={styles.card}>
        {users.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: "#888", fontSize: "14px" }}>No registrations yet.</p>
            <button onClick={fetchUsers} style={{ ...styles.btnSecondary, marginTop: "12px" }}>
              Load registrations
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Event</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id || i} style={styles.tr}>
                  <td style={{ ...styles.td, color: "#aaa", fontSize: "12px" }}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{u.name}</td>
                  <td style={{ ...styles.td, color: "#666" }}>{u.email}</td>
                  <td style={styles.td}>{u.phone}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{u.event}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {users.length === 0 ? null : (
        <button onClick={fetchUsers} style={{ ...styles.btnSecondary, marginTop: "12px" }}>
          Refresh
        </button>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "680px", margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" },
  header: { marginBottom: "1.5rem" },
  h1: { fontSize: "22px", fontWeight: 500, color: "#111", margin: 0 },
  subtext: { fontSize: "14px", color: "#888", marginTop: "4px" },

  card: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 500, color: "#555" },
  input: { padding: "8px 12px", fontSize: "14px", border: "0.5px solid #ddd", borderRadius: "8px", outline: "none", background: "#fafafa", color: "#111" },

  btnRow: { display: "flex", gap: "10px", marginTop: "1rem", alignItems: "center", flexWrap: "wrap" },
  btnPrimary: { padding: "9px 20px", fontSize: "14px", fontWeight: 500, background: "#534AB7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  btnSecondary: { padding: "9px 20px", fontSize: "14px", fontWeight: 500, background: "transparent", color: "#333", border: "0.5px solid #ccc", borderRadius: "8px", cursor: "pointer" },

  toastSuccess: { fontSize: "13px", padding: "7px 14px", borderRadius: "8px", background: "#eaf3de", color: "#3B6D11", fontWeight: 500 },
  toastError: { fontSize: "13px", padding: "7px 14px", borderRadius: "8px", background: "#fcebeb", color: "#A32D2D", fontWeight: 500 },

  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "1.5rem 0" },
  dividerLine: { flex: 1, borderTop: "0.5px solid #e5e5e5" },
  dividerText: { fontSize: "13px", fontWeight: 500, color: "#888", whiteSpace: "nowrap" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "1rem" },
  statCard: { background: "#f7f7f7", borderRadius: "8px", padding: "12px 14px" },
  statLabel: { fontSize: "12px", color: "#888" },
  statValue: { fontSize: "20px", fontWeight: 500, color: "#111", marginTop: "2px" },

  emptyState: { textAlign: "center", padding: "2rem" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  thead: { borderBottom: "0.5px solid #eee" },
  th: { textAlign: "left", padding: "8px 10px", fontSize: "12px", fontWeight: 500, color: "#888" },
  td: { padding: "10px 10px", color: "#111", borderBottom: "0.5px solid #f0f0f0" },
  tr: {},
  badge: { display: "inline-block", fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#EEEDFE", color: "#3C3489", fontWeight: 500 },
};

export default Register;