import { useEffect, useState, useCallback } from "react";
import "./Todo.css";
import { getApiEndpoint, getAiEndpoint } from "../config/config";
import AuthModal from "./AuthModal";

// Parse response into array of tasks
const parseResponse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    return Object.keys(data).map((key) => ({
      id: key,
      title: data[key].title || data[key].text || "",
      text: data[key].title || data[key].text || "",
      completed: data[key].completed || false,
      priority: data[key].priority || null,
      description: data[key].description || "",
      suggestedDeadline: data[key].suggestedDeadline || null,
      subtasks: data[key].subtasks || [],
      aiGenerated: data[key].aiGenerated || false,
    }));
  }
  return [];
};

function Todo({ themeColor = "#8b5cf6", onOpenAuth }) {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AI-powered state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiNotice, setAiNotice] = useState(null);

  const [localAuthModal, setLocalAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const getAuthToken = () => localStorage.getItem("auth_token");

  // Auth accent: white + pink for girls, blue for boys
  const authAccent =
    currentUser && currentUser.gender === "male" ? "#2563eb" : "#ec4899";

  // Fetch tasks
  const getTasks = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiEndpoint(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setCurrentUser(null);
        window.dispatchEvent(new Event("auth_change"));
        throw new Error("Session expired. Please log in again.");
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTasks(parseResponse(data));
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync auth state across windows and navbar interactions
  useEffect(() => {
    const syncAuth = () => {
      const saved = localStorage.getItem("auth_user");
      const user = saved ? JSON.parse(saved) : null;
      setCurrentUser(user);
      if (user) {
        getTasks();
      } else {
        setTasks([]);
      }
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth_change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth_change", syncAuth);
    };
  }, [getTasks]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const res = await fetch(getApiEndpoint(), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          if (isMounted) {
            setCurrentUser(null);
            setTasks([]);
          }
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setTasks(parseResponse(data));
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch tasks on mount:", err);
        }
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const openAuth = (mode = "login") => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      setLocalAuthModal({ isOpen: true, mode });
    }
  };

  // Auth Success Callback
  const handleAuthSuccess = (data) => {
    setCurrentUser(data.user);
    setError(null);
    getTasks();
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setCurrentUser(null);
    setTasks([]);
    setText("");
    setEditId(null);
    setError(null);
    setAiSuggestion(null);
    window.dispatchEvent(new Event("auth_change"));
  };

  // AI Task Enhancement Request
  const handleAiAssist = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please enter a task title first to get AI suggestions.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      openAuth("login");
      return;
    }

    setAiLoading(true);
    setAiNotice(null);
    setError(null);

    try {
      const res = await fetch(getAiEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: trimmed }),
      });

      if (res.status === 401) {
        handleLogout();
        openAuth("login");
        return;
      }

      const resData = await res.json();
      if (!res.ok || !resData.data) {
        throw new Error(resData.message || "AI service is currently unavailable.");
      }

      setAiSuggestion(resData.data);
      if (resData.warning) {
        setAiNotice(resData.warning);
      }
    } catch (err) {
      console.warn("AI assistance call handled gracefully:", err.message);
      // Graceful error display: informs the user without crashing or blocking regular task creation
      setAiNotice("AI assist encountered a temporary issue. You can still add tasks normally.");
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI Suggestion directly into the task
  const applyAiSuggestion = async () => {
    if (!aiSuggestion) return;

    const token = getAuthToken();
    if (!token) {
      openAuth("login");
      return;
    }

    setError(null);
    try {
      const payload = {
        title: aiSuggestion.title || text.trim(),
        description: aiSuggestion.description || "",
        priority: aiSuggestion.priority || "Medium",
        dueDate: null,
        subtasks: (aiSuggestion.suggestedSubtasks || []).map((st) => ({
          title: st,
          completed: false,
        })),
        aiGenerated: true,
      };

      const res = await fetch(getApiEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        handleLogout();
        openAuth("login");
        return;
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to save AI-enhanced task.");
      }

      setAiSuggestion(null);
      setText("");
      getTasks();
    } catch (err) {
      console.error("Failed to apply AI suggestion:", err);
      setError(err.message);
    }
  };

  // Save Task (Create or Update)
  const saveTask = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Task title is required and cannot be empty.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      openAuth("login");
      setError("Please sign in or create an account to manage tasks.");
      return;
    }

    setError(null);

    try {
      const endpoint = editId ? getApiEndpoint(editId) : getApiEndpoint();
      const method = editId ? "PUT" : "POST";
      const payload = {
        title: trimmed,
        ...(aiSuggestion && {
          description: aiSuggestion.description,
          priority: aiSuggestion.priority,
          subtasks: (aiSuggestion.suggestedSubtasks || []).map((st) => ({
            title: st,
            completed: false,
          })),
          aiGenerated: true,
        }),
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        handleLogout();
        openAuth("login");
        throw new Error("Session expired. Please log in again.");
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to save task.");
      }

      setEditId(null);
      setText("");
      setAiSuggestion(null);
      getTasks();
    } catch (err) {
      console.error("Failed to save task:", err);
      setError(err.message);
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    const token = getAuthToken();
    if (!token) {
      openAuth("login");
      return;
    }

    setError(null);
    try {
      const endpoint = getApiEndpoint(id);
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        openAuth("login");
        throw new Error("Session expired. Please log in again.");
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete task.");
      }

      getTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError(err.message);
    }
  };

  // Toggle Complete Status
  const toggleComplete = async (task) => {
    const token = getAuthToken();
    if (!token) {
      openAuth("login");
      return;
    }

    try {
      const endpoint = getApiEndpoint(task.id);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (res.status === 401) {
        handleLogout();
        openAuth("login");
        return;
      }

      getTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message);
    }
  };

  // Edit Task
  const editTask = (task) => {
    setText(task.title || task.text || "");
    setEditId(task.id);
    setAiSuggestion(null);
  };

  // Handle Enter Key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveTask();
  };

  // Separate tasks by status
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const renderTask = (task) => (
    <div
      key={task.id}
      className={`todo-item ${task.completed ? "completed" : ""}`}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            className="todo-item-text"
            onClick={() => toggleComplete(task)}
            title="Click to toggle completion"
            style={{ cursor: "pointer", fontWeight: 600 }}
          >
            {task.title || task.text}
          </span>

          {task.priority && (
            <span
              className={`todo-item-priority ${task.priority.toLowerCase()}`}
              title={`AI Suggested Priority: ${task.priority}`}
            >
              {task.priority === "High" ? "🔴 High" : task.priority === "Medium" ? "🟡 Med" : "🟢 Low"}
            </span>
          )}

          {task.aiGenerated && (
            <span
              style={{
                fontSize: "10px",
                color: "#c084fc",
                background: "rgba(192, 132, 252, 0.15)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
              title="Enhanced with AI"
            >
              ✨ AI
            </span>
          )}
        </div>

        {task.description && (
          <span className="todo-item-desc" style={{ marginTop: "4px" }}>
            {task.description}
          </span>
        )}

        {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
          <div style={{ marginTop: "6px", fontSize: "11px", color: "#9ca3af" }}>
            📋 {task.subtasks.length} subtasks planned
          </div>
        )}
      </div>

      <span
        className={`status-pill ${task.completed ? "is-success" : "is-warning"}`}
      >
        <span className="status-dot" aria-hidden="true"></span>
        {task.completed ? "Completed" : "Pending"}
      </span>

      <div className="todo-actions">
        <button className="btn btn-sm btn-ghost" onClick={() => editTask(task)}>
          Edit
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => deleteTask(task.id)}>
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="todo-section">
      <div className="todo-header-bar">
        <div className="todo-heading">
          <h2>📋 Task Management Application</h2>
          <p className="todo-subtitle">
            Create, track and finish your tasks in one place with AI-powered assistance.
          </p>
        </div>

        <div className="todo-auth-actions" style={{ "--todo-auth-accent": authAccent }}>
          {currentUser ? (
            <div className="todo-user-badge">
              <span className="user-greeting">
                👤 <strong>{currentUser.name}</strong> ({currentUser.email})
              </span>
              <button className="todo-auth-btn logout btn btn-sm" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          ) : (
            <div className="todo-guest-btn-group">
              <button
                className="todo-auth-btn login-outline btn btn-sm"
                onClick={() => openAuth("login")}
              >
                Sign In
              </button>
              <button
                className="todo-auth-btn login-solid btn btn-sm"
                onClick={() => openAuth("register")}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {currentUser && !loading && (
        <div className="todo-stats" role="group" aria-label="Task summary">
          <div className="todo-stat">
            <span className="todo-stat-label">Total tasks</span>
            <span className="todo-stat-value">{tasks.length}</span>
          </div>
          <div className="todo-stat">
            <span className="todo-stat-label">Pending</span>
            <span className="todo-stat-value is-warning">
              {pendingTasks.length}
            </span>
          </div>
          <div className="todo-stat">
            <span className="todo-stat-label">Completed</span>
            <span className="todo-stat-value is-success">
              {completedTasks.length}
            </span>
          </div>
        </div>
      )}

      {!currentUser && (
        <div className="todo-auth-prompt">
          <p>🔒 Sign in or Sign up to access your protected tasks securely with JWT authentication.</p>
        </div>
      )}

      <div className="todo-input-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentUser ? "Enter task title (e.g., 'Prepare quarterly budget presentation')..." : "Sign in to add a task..."}
          disabled={!currentUser}
        />
        <button
          type="button"
          className="btn-ai"
          onClick={handleAiAssist}
          disabled={!currentUser || aiLoading || !text.trim()}
          title="Analyze with AI: Generate description, priority, and deadline"
        >
          {aiLoading ? (
            <>
              <span className="btn-ai-spinner"></span>
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>AI Assist</span>
            </>
          )}
        </button>
        <button
          className="btn btn-primary"
          onClick={saveTask}
          disabled={!currentUser}
          style={{ backgroundColor: themeColor }}
        >
          {editId ? "Update" : "Add Task"}
        </button>
      </div>

      {/* Meaningful AI-generated Suggestion Card */}
      {aiSuggestion && (
        <div className="todo-ai-card" role="region" aria-label="AI Generated Suggestions">
          <div className="todo-ai-card-header">
            <div className="todo-ai-title-wrap">
              <span>🤖</span>
              <h4>AI Task Plan: {aiSuggestion.title}</h4>
            </div>
            <span className="todo-ai-provider-pill">
              Powered by {aiSuggestion.provider || "AI"}
            </span>
          </div>

          <div className="todo-ai-meta-row">
            <span className={`todo-ai-badge priority-${(aiSuggestion.priority || 'medium').toLowerCase()}`}>
              Priority: {aiSuggestion.priority}
            </span>
            {aiSuggestion.suggestedDeadline && (
              <span className="todo-ai-badge deadline">
                📅 Proposed Deadline: {aiSuggestion.suggestedDeadline}
              </span>
            )}
          </div>

          {aiSuggestion.reasoning && (
            <div style={{ fontSize: "12px", color: "#a5b4fc", marginBottom: "8px", fontStyle: "italic" }}>
              💡 Reasoning: {aiSuggestion.reasoning}
            </div>
          )}

          {aiSuggestion.description && (
            <div className="todo-ai-desc">
              <strong>Description:</strong> {aiSuggestion.description}
            </div>
          )}

          {Array.isArray(aiSuggestion.suggestedSubtasks) && aiSuggestion.suggestedSubtasks.length > 0 && (
            <div>
              <div className="todo-ai-subtasks-title">Actionable Subtasks Checklist:</div>
              <ul className="todo-ai-subtasks-list">
                {aiSuggestion.suggestedSubtasks.map((st, i) => (
                  <li key={i}>
                    <span className="todo-ai-subtask-check">✔</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="todo-ai-actions">
            <button
              type="button"
              className="todo-ai-dismiss-btn"
              onClick={() => setAiSuggestion(null)}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="todo-ai-apply-btn"
              onClick={applyAiSuggestion}
            >
              ✨ Apply & Create Task
            </button>
          </div>
        </div>
      )}

      {aiNotice && (
        <div style={{ fontSize: "12px", color: "#fbbf24", margin: "6px 0", background: "rgba(245,158,11,0.1)", padding: "6px 12px", borderRadius: "6px" }}>
          ℹ️ {aiNotice}
        </div>
      )}

      {error && (
        <div className="todo-error-message">
          ⚠️ {error}
        </div>
      )}

      <hr className="todo-divider" />

      <div className="todo-list">
        {loading ? (
          <div
            className="todo-skeleton-list"
            role="status"
            aria-label="Loading tasks"
          >
            <div className="todo-skeleton-row skeleton"></div>
            <div className="todo-skeleton-row skeleton"></div>
            <div className="todo-skeleton-row skeleton"></div>
          </div>
        ) : !currentUser ? (
          <div className="todo-empty">
            <span>🔐</span>
            Please sign in or sign up above to view and manage your tasks.
          </div>
        ) : tasks.length === 0 ? (
          <div className="todo-empty">
            <span>✨</span>
            No tasks yet — create your first task above!
          </div>
        ) : (
          <div className="todo-status-sections">
            <section className="todo-status-section">
              <header className="todo-status-header pending">
                <span className="todo-status-icon">⏳</span>
                <h3>Pending</h3>
                <span className="todo-status-count">{pendingTasks.length}</span>
              </header>
              {pendingTasks.length === 0 ? (
                <div className="todo-status-empty">
                  No pending tasks — you're all caught up!
                </div>
              ) : (
                pendingTasks.map(renderTask)
              )}
            </section>

            <section className="todo-status-section">
              <header className="todo-status-header completed">
                <span className="todo-status-icon">✅</span>
                <h3>Completed</h3>
                <span className="todo-status-count">
                  {completedTasks.length}
                </span>
              </header>
              {completedTasks.length === 0 ? (
                <div className="todo-status-empty">
                  No completed tasks yet.
                </div>
              ) : (
                completedTasks.map(renderTask)
              )}
            </section>
          </div>
        )}
      </div>

      {/* Fallback local AuthModal if onOpenAuth is not provided */}
      {!onOpenAuth && (
        <AuthModal
          isOpen={localAuthModal.isOpen}
          initialMode={localAuthModal.mode}
          onClose={() => setLocalAuthModal({ isOpen: false, mode: 'login' })}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default Todo;
