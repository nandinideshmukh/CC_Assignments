import React, { useEffect, useState } from "react";
import axios from "axios";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      setTasks(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      await fetchTasks();
    } catch (err) {
      setError("Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (task) => {
    setUpdatingId(task._id);
    try {
      await axios.put(`http://localhost:5000/api/tasks/${task._id}`, {
        status: task.status === "pending" ? "completed" : "pending"
      });
      await fetchTasks();
    } catch (err) {
      setError("Failed to update task");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="task-list-container">
      <style>
        {`
          .task-list-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
          }
          
          .task-list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .task-list-title {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          
          .task-count {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
          }
          
          .refresh-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
            color: #667eea;
          }
          
          .refresh-button:hover {
            background: #f0f0f0;
            transform: rotate(180deg);
          }
          
          .loading-container {
            text-align: center;
            padding: 3rem;
          }
          
          .loader {
            display: inline-block;
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .error-message {
            background: #fed7d7;
            color: #c53030;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            border-left: 4px solid #c53030;
          }
          
          .empty-state {
            text-align: center;
            padding: 3rem;
            background: #f7fafc;
            border-radius: 15px;
          }
          
          .empty-emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          
          .empty-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 0.5rem;
          }
          
          .empty-text {
            color: #718096;
          }
          
          .task-card {
            background: white;
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-left: 4px solid;
          }
          
          .task-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }
          
          .task-card.pending {
            border-left-color: #ecc94b;
          }
          
          .task-card.completed {
            border-left-color: #48bb78;
            background: #f7fafc;
          }
          
          .task-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.75rem;
            flex-wrap: wrap;
          }
          
          .task-title {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
          }
          
          .task-title.completed {
            text-decoration: line-through;
            color: #a0aec0;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          .status-badge.pending {
            background: #fef5e7;
            color: #d69e2e;
          }
          
          .status-badge.completed {
            background: #e6fffa;
            color: #38a169;
          }
          
          .task-description {
            color: #4a5568;
            margin-bottom: 1rem;
            line-height: 1.5;
          }
          
          .task-description.completed {
            text-decoration: line-through;
            color: #a0aec0;
          }
          
          .task-actions {
            display: flex;
            gap: 0.75rem;
          }
          
          .action-button {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          
          .action-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .action-button.complete {
            background: #48bb78;
            color: white;
          }
          
          .action-button.complete:hover:not(:disabled) {
            background: #38a169;
            transform: translateY(-1px);
          }
          
          .action-button.reopen {
            background: #ecc94b;
            color: #744210;
          }
          
          .action-button.reopen:hover:not(:disabled) {
            background: #d69e2e;
            transform: translateY(-1px);
          }
          
          .action-button.delete {
            background: #fc8181;
            color: white;
          }
          
          .action-button.delete:hover:not(:disabled) {
            background: #f56565;
            transform: translateY(-1px);
          }
          
          .small-spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.6s linear infinite;
          }
          
          @media (max-width: 640px) {
            .task-header {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .task-actions {
              flex-direction: column;
            }
            
            .action-button {
              justify-content: center;
            }
          }
        `}
      </style>
      
      <div className="task-list-header">
        <div>
          <h1 className="task-list-title">📋 Task List</h1>
          <span className="task-count">{tasks.length} tasks</span>
        </div>
        <button className="refresh-button" onClick={fetchTasks} title="Refresh">
          🔄
        </button>
      </div>
      
      {error && <div className="error-message">⚠️ {error}</div>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p style={{ marginTop: '1rem', color: '#718096' }}>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📭</div>
          <div className="empty-title">No tasks yet</div>
          <div className="empty-text">Create your first task using the form above!</div>
        </div>
      ) : (
        tasks.map((task) => (
          <div key={task._id} className={`task-card ${task.status}`}>
            <div className="task-header">
              <h3 className={`task-title ${task.status === "completed" ? "completed" : ""}`}>
                {task.title}
              </h3>
              <span className={`status-badge ${task.status}`}>
                {task.status === "completed" ? "✅ Completed" : "⏳ Pending"}
              </span>
            </div>
            
            {task.description && (
              <div className={`task-description ${task.status === "completed" ? "completed" : ""}`}>
                {task.description}
              </div>
            )}
            
            <div className="task-actions">
              <button
                onClick={() => toggleStatus(task)}
                disabled={updatingId === task._id}
                className={`action-button ${task.status === "pending" ? "complete" : "reopen"}`}
              >
                {updatingId === task._id ? (
                  <>
                    <div className="small-spinner"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    {task.status === "pending" ? "✓ Complete" : "↺ Reopen"}
                  </>
                )}
              </button>
              
              <button
                onClick={() => deleteTask(task._id)}
                disabled={deletingId === task._id}
                className="action-button delete"
              >
                {deletingId === task._id ? (
                  <>
                    <div className="small-spinner"></div>
                    Deleting...
                  </>
                ) : (
                  "🗑 Delete"
                )}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default TaskList;