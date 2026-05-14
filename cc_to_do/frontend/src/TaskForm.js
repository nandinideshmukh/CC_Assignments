import React, { useState } from "react";
import axios from "axios";

function TaskForm() {
  const [task, setTask] = useState({
    title: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setTask({
      ...task,
      [e.target.name]: e.target.value
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!task.title.trim()) {
      setError("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("https://ccbackend-gmbadxdub9hub3be.centralindia-01.azurewebsites.net/api/tasks", task);
      setSuccess("Task added successfully!");
      setTask({ title: "", description: "" });
      
      // Optional: Reload after 1 second to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("Failed to add task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="task-form-container">
      <style>
        {`
          .task-form-container {
            max-width: 500px;
            margin: 2rem auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          .task-form {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          
          .form-title {
            margin: 0 0 1.5rem 0;
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-align: center;
          }
          
          .form-group {
            margin-bottom: 1.5rem;
          }
          
          .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
            font-size: 0.9rem;
          }
          
          .form-label.required::after {
            content: '*';
            color: #f56565;
            margin-left: 4px;
          }
          
          .form-input,
          .form-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            font-family: inherit;
            box-sizing: border-box;
          }
          
          .form-input:focus,
          .form-textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          .form-textarea {
            resize: vertical;
            min-height: 100px;
          }
          
          .error-message {
            background: #fed7d7;
            color: #c53030;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            border-left: 4px solid #c53030;
          }
          
          .success-message {
            background: #c6f6d5;
            color: #22543d;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            border-left: 4px solid #38a169;
          }
          
          .submit-button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .submit-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }
          
          .submit-button:active:not(:disabled) {
            transform: translateY(0);
          }
          
          .submit-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .button-content {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          @media (max-width: 640px) {
            .task-form-container {
              margin: 1rem;
              padding: 1rem;
            }
            
            .task-form {
              padding: 1.5rem;
            }
            
            .form-title {
              font-size: 1.5rem;
            }
          }
        `}
      </style>
      
      <div className="task-form">
        <h2 className="form-title">✨ Create New Task</h2>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              ✓ {success}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label required">Task Title</label>
            <input
              name="title"
              type="text"
              className="form-input"
              placeholder="Enter task title..."
              value={task.title}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Enter task description (optional)..."
              value={task.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            <div className="button-content">
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Adding Task...
                </>
              ) : (
                <>
                  ➕ Add Task
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;