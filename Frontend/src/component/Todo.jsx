import { useEffect, useState } from "react";
import "./Todo.css";
import { getApiEndpoint, CONFIG } from "../config/config";

// Parse RTDB response (object with keys or array) into tasks array
const parseResponse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    return Object.keys(data).map((key) => ({
      id: key,
      text: data[key].text || "",
      completed: data[key].completed || false,
    }));
  }
  return [];
};

function Todo() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks
  const getTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiEndpoint());
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("403 Forbidden — Update your Firebase RTDB rules to allow read/write");
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks(parseResponse(data));
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(`Unable to connect: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(getApiEndpoint());
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("403 Forbidden — Update your Firebase RTDB rules to allow read/write");
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setTasks(parseResponse(data));
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch tasks:", err);
          setError(`Unable to connect: ${err.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save Task (Create or Update)
  const saveTask = async () => {
    if (!text.trim()) return;
    setError(null);

    try {
      let updatedTasks = [];
      if (editId) {
        updatedTasks = tasks.map((t) =>
          String(t.id) === String(editId) ? { ...t, text: text.trim() } : t
        );
      } else {
        const newTask = {
          id: String(Date.now()),
          text: text.trim(),
          completed: false,
        };
        updatedTasks = [newTask, ...tasks];
      }

      if (CONFIG.MODE === "firebase_rtdb") {
        if (editId) {
          const endpoint = getApiEndpoint(editId);
          const res = await fetch(endpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.trim() }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } else {
          const endpoint = getApiEndpoint();
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.trim(), completed: false }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
      } else {
        const endpoint = editId ? getApiEndpoint(editId) : getApiEndpoint();
        const method = editId ? "PUT" : "POST";
        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      setEditId(null);
      setText("");
      setTasks(updatedTasks);
      getTasks();
    } catch (err) {
      console.error("Failed to save task:", err);
      if (err.message.includes("403")) {
        setError("Failed to save: Firebase RTDB rules block writes. Set rules to allow write access.");
      } else {
        setError(`Failed to save task: ${err.message}`);
      }
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    setError(null);
    try {
      const updatedTasks = tasks.filter((t) => String(t.id) !== String(id));
      const endpoint = getApiEndpoint(id);
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setTasks(updatedTasks);
      getTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  // Toggle Complete Status
  const toggleComplete = async (task) => {
    try {
      const updatedTasks = tasks.map((t) =>
        String(t.id) === String(task.id) ? { ...t, completed: !t.completed } : t
      );

      if (CONFIG.MODE === "firebase_rtdb") {
        const endpoint = getApiEndpoint(task.id);
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !task.completed }),
        });
      } else {
        const endpoint = getApiEndpoint(task.id);
        await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !task.completed }),
        });
      }

      setTasks(updatedTasks);
      getTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Edit Task
  const editTask = (task) => {
    setText(task.text);
    setEditId(task.id);
  };

  // Handle Enter Key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveTask();
  };

  return (
    <div className="todo-section">
      <h2>📋 Task Manager (Firebase Realtime Database)</h2>

      <div className="todo-input-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
        />
        <button onClick={saveTask}>
          {editId ? "Update" : "Add"}
        </button>
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginTop: "10px", fontSize: "0.9rem" }}>
          ⚠️ {error}
        </div>
      )}

      <hr className="todo-divider" />

      <div className="todo-list">
        {loading ? (
          <div className="todo-empty">Connecting to Firebase database...</div>
        ) : tasks.length === 0 ? (
          <div className="todo-empty">
            <span>✨</span>
            No tasks yet — add one above!
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
                title="Click to toggle status"
                style={{ cursor: "pointer" }}
              >
                {task.text}
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
    </div>
  );
}

export default Todo;