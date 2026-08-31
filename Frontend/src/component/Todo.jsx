import { useEffect, useState, useCallback } from "react";
import "./Todo.css";
import { getApiEndpoint } from "../config/config";
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
  const [localAuthModal, setLocalAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const getAuthToken = () => localStorage.getItem("auth_token");

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
    window.dispatchEvent(new Event("auth_change"));
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
      const payload = { title: trimmed };

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
  };

  // Handle Enter Key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveTask();
  };

  return (
    <div className="todo-section">
      <div className="todo-header-bar">
        <h2>📋 Task Management Application</h2>

        <div className="todo-auth-actions">
          {currentUser ? (
            <div className="todo-user-badge">
              <span className="user-greeting">
                👤 <strong>{currentUser.name}</strong> ({currentUser.email})
              </span>
              <button className="todo-auth-btn logout" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          ) : (
            <div className="todo-guest-btn-group">
              <button
                className="todo-auth-btn login-outline"
                onClick={() => openAuth("login")}
              >
                Sign In
              </button>
              <button
                className="todo-auth-btn login-solid"
                style={{ backgroundColor: themeColor }}
                onClick={() => openAuth("register")}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

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
          placeholder={currentUser ? "What needs to be done?" : "Sign in to add a task..."}
          disabled={!currentUser}
        />
        <button
          onClick={saveTask}
          disabled={!currentUser}
          style={{ backgroundColor: themeColor }}
        >
          {editId ? "Update" : "Add Task"}
        </button>
      </div>

      {error && (
        <div className="todo-error-message">
          ⚠️ {error}
        </div>
      )}

      <hr className="todo-divider" />

      <div className="todo-list">
        {loading ? (
          <div className="todo-empty">Loading tasks...</div>
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
          tasks.map((task) => (
            <div
              key={task.id}
              className={`todo-item ${task.completed ? "completed" : ""}`}
            >
              <span
                className="todo-item-text"
                onClick={() => toggleComplete(task)}
                title="Click to toggle completion"
                style={{ cursor: "pointer" }}
              >
                {task.title || task.text}
              </span>

              <div className="todo-actions">
                <button className="todo-btn-edit" onClick={() => editTask(task)}>
                  Edit
                </button>
                <button className="todo-btn-delete" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fallback local AuthModal if onOpenAuth is not provided */}
      {!onOpenAuth && (
        <AuthModal
          isOpen={localAuthModal.isOpen}
          initialMode={localAuthModal.mode}
          onClose={() => setLocalAuthModal({ isOpen: false, mode: 'login' })}
          onAuthSuccess={handleAuthSuccess}
          themeColor={themeColor}
        />
      )}
    </div>
  );
}

export default Todo;