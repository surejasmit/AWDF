const RTDB_BASE_URL = "https://awdf-ba2b7-default-rtdb.firebaseio.com/tasks";

// Local fallback store if Firebase RTDB is unreachable
let localMemoryTasks = [
  { id: "1", text: "Learn React 19", completed: false },
  { id: "2", text: "Setup Express API & Firebase Config", completed: true }
];

// Build RTDB endpoint URL
const rtdbUrl = (id = "") => id ? `${RTDB_BASE_URL}/${id}.json` : `${RTDB_BASE_URL}.json`;

// Normalize RTDB response (object with keys) into array of tasks
const normalizeTasks = (data) => {
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

// 1. Fetch all tasks
exports.getAllTasks = async () => {
  try {
    const res = await fetch(rtdbUrl());
    if (res.ok) {
      const data = await res.json();
      const remoteTasks = normalizeTasks(data);
      if (remoteTasks.length > 0) {
        return remoteTasks;
      }
    } else {
      const body = await res.text();
      console.warn(`RTDB GET failed HTTP ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("RTDB GET failed, returning local memory tasks:", err.message);
  }
  return localMemoryTasks;
};

// 2. Fetch task by ID
exports.getTaskById = async (id) => {
  try {
    const res = await fetch(rtdbUrl(id));
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return { id, text: data.text || "", completed: data.completed || false };
      }
    }
  } catch (err) {
    console.warn("RTDB getTaskById failed:", err.message);
  }
  return localMemoryTasks.find((t) => String(t.id) === String(id)) || null;
};

// 3. Create task
exports.createTask = async (text) => {
  const newTask = {
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(rtdbUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });

    if (res.ok) {
      const result = await res.json();
      const createdTask = { id: result.name, text: newTask.text, completed: newTask.completed };
      localMemoryTasks.unshift(createdTask);
      console.log("Task saved to RTDB:", createdTask.id);
      return createdTask;
    } else {
      const body = await res.text();
      console.warn(`RTDB POST failed HTTP ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("RTDB save failed, saving to local memory:", err.message);
  }

  const fallbackTask = { id: String(Date.now()), ...newTask };
  localMemoryTasks.unshift(fallbackTask);
  return fallbackTask;
};

// 4. Update task
exports.updateTask = async (id, text, completed) => {
  const index = localMemoryTasks.findIndex((t) => String(t.id) === String(id));
  if (index !== -1) {
    localMemoryTasks[index] = {
      ...localMemoryTasks[index],
      ...(text ? { text } : {}),
      ...(completed !== undefined ? { completed } : {}),
    };
  }

  try {
    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;

    if (Object.keys(updateData).length > 0) {
      const res = await fetch(rtdbUrl(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        console.log("Task updated in RTDB:", id);
      } else {
        const body = await res.text();
        console.warn(`RTDB PATCH failed HTTP ${res.status}: ${body}`);
      }
    }
  } catch (err) {
    console.warn("RTDB update failed, updated in local memory:", err.message);
  }

  return localMemoryTasks[index] || { id, text, completed };
};

// 5. Delete task
exports.deleteTask = async (id) => {
  const initialLen = localMemoryTasks.length;
  localMemoryTasks = localMemoryTasks.filter((t) => String(t.id) !== String(id));

  try {
    const res = await fetch(rtdbUrl(id), { method: "DELETE" });
    if (res.ok) {
      console.log("Task deleted from RTDB:", id);
    } else {
      const body = await res.text();
      console.warn(`RTDB DELETE failed HTTP ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("RTDB delete failed, deleted from local memory:", err.message);
  }

  return localMemoryTasks.length < initialLen || true;
};
