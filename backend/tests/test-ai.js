/**
 * Automated Test Suite for AI-Powered Task Enhancement
 * Tests authentication, AI suggestion payload, graceful fallbacks, and task creation.
 */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Task = require("../src/models/Task");
const bcrypt = require("bcryptjs");

const TEST_PORT = 5059;
let server;

const mockDb = {
  users: [],
  tasks: [],
};

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          try {
            const json = responseBody ? JSON.parse(responseBody) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function setupMockLayer() {
  User.findOne = async function (filter) {
    if (filter.email) {
      const found = mockDb.users.find((u) => u.email === filter.email.toLowerCase());
      return found ? createMockUserDoc(found) : null;
    }
    if (filter._id) {
      const found = mockDb.users.find((u) => u._id.toString() === filter._id.toString());
      return found ? createMockUserDoc(found) : null;
    }
    return null;
  };

  User.findById = async function (id) {
    const found = mockDb.users.find((u) => u._id.toString() === id.toString());
    return found ? createMockUserDoc(found) : null;
  };

  const createMockUserDoc = (data) => ({
    _id: data._id,
    name: data.name,
    email: data.email,
    password: data.password,
    createdAt: data.createdAt,
    comparePassword: async function (cand) {
      return await bcrypt.compare(cand, this.password);
    },
    toJSON: function () {
      return { id: this._id.toString(), name: this.name, email: this.email };
    },
  });

  User.prototype.save = async function () {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    const userDoc = {
      _id: new mongoose.Types.ObjectId(),
      name: this.name,
      email: this.email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    };
    mockDb.users.push(userDoc);
    return createMockUserDoc(userDoc);
  };

  Task.find = function (filter) {
    let filtered = mockDb.tasks;
    if (filter.user) {
      filtered = filtered.filter((t) => t.user.toString() === filter.user.toString());
    }
    return {
      sort: () =>
        filtered.map((t) => ({
          _id: t._id,
          title: t.title,
          completed: t.completed,
          priority: t.priority,
          description: t.description,
          aiGenerated: t.aiGenerated,
          user: t.user,
          createdAt: t.createdAt,
          toJSON: () => ({
            id: t._id.toString(),
            title: t.title,
            completed: t.completed,
            priority: t.priority,
            description: t.description,
            aiGenerated: t.aiGenerated,
            user: t.user.toString(),
            createdAt: t.createdAt,
          }),
        })),
    };
  };

  Task.prototype.save = async function () {
    const taskDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: this.title,
      completed: this.completed,
      priority: this.priority || "Medium",
      description: this.description || "",
      aiGenerated: this.aiGenerated || false,
      user: this.user,
      createdAt: new Date(),
    };
    mockDb.tasks.push(taskDoc);
    return {
      _id: taskDoc._id,
      title: taskDoc.title,
      completed: taskDoc.completed,
      priority: taskDoc.priority,
      description: taskDoc.description,
      aiGenerated: taskDoc.aiGenerated,
      user: taskDoc.user,
      toJSON: () => ({
        id: taskDoc._id.toString(),
        title: taskDoc.title,
        completed: taskDoc.completed,
        priority: taskDoc.priority,
        description: taskDoc.description,
        aiGenerated: taskDoc.aiGenerated,
        user: taskDoc.user.toString(),
      }),
    };
  };
}

async function runAiTests() {
  setupMockLayer();

  server = app.listen(TEST_PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("\n=======================================================");
  console.log("       AI-POWERED TASK ASSISTANT TEST SUITE            ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Authentication protection on AI endpoints
    const unauthRes = await request("POST", "/api/ai/suggest", { title: "Test task" });
    assert(unauthRes.status === 401, "Reject AI suggestion request without JWT token (401 Unauthorized)");

    // 2. Register user to obtain valid JWT token
    const regRes = await request("POST", "/auth/register", {
      name: "AI Test User",
      email: "ai.tester@example.com",
      password: "Password123!",
    });
    const token = regRes.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Validation: reject empty task title
    const emptyTitleRes = await request("POST", "/api/ai/suggest", { title: "   " }, authHeaders);
    assert(emptyTitleRes.status === 400, "Reject AI suggestion with empty title (400 Bad Request)");

    // 4. Test AI suggestion generation
    console.log("  Invoking AI enhancement endpoint with live API key...");
    const aiRes = await request(
      "POST",
      "/api/ai/suggest",
      { title: "Fix auth security token bug" },
      authHeaders
    );
    assert(aiRes.status === 200, "POST /api/ai/suggest returns 200 OK");
    assert(aiRes.body.success === true, "Response reports success: true");

    const aiData = aiRes.body.data;
    assert(typeof aiData.description === "string" && aiData.description.length > 0, "AI generated meaningful task description");
    assert(["Low", "Medium", "High"].includes(aiData.priority), `AI suggested valid priority level: ${aiData.priority}`);
    assert(typeof aiData.suggestedDeadline === "string", `AI proposed realistic deadline: ${aiData.suggestedDeadline}`);
    assert(Array.isArray(aiData.suggestedSubtasks) && aiData.suggestedSubtasks.length > 0, `AI generated ${aiData.suggestedSubtasks?.length} actionable subtasks`);
    assert(aiData.aiGenerated === true, "Output metadata flags aiGenerated: true");
    console.log(`  AI Provider: ${aiData.provider}`);
    console.log(`  Suggested Priority: ${aiData.priority} | Deadline: ${aiData.suggestedDeadline}`);

    // 5. Test alias endpoint /tasks/ai-suggest
    const aliasRes = await request(
      "POST",
      "/tasks/ai-suggest",
      { title: "Prepare quarterly financial presentation" },
      authHeaders
    );
    assert(aliasRes.status === 200, "POST /tasks/ai-suggest alias returns 200 OK");
    assert(aliasRes.body.data && aliasRes.body.data.priority, "Alias endpoint returns structured AI analysis");

    // 6. Test creating task with AI-suggested fields
    const createTaskRes = await request(
      "POST",
      "/tasks",
      {
        title: "Fix auth security token bug",
        description: aiData.description,
        priority: aiData.priority,
        aiGenerated: true,
      },
      authHeaders
    );
    assert(createTaskRes.status === 201, "Create task with AI fields returns 201 Created");
    assert(createTaskRes.body.priority === aiData.priority, "Saved task preserves AI suggested priority");
    assert(createTaskRes.body.description === aiData.description, "Saved task preserves AI generated description");

    // 7. Verify tasks list includes AI attributes
    const listRes = await request("GET", "/tasks", null, authHeaders);
    const created = listRes.body.find((t) => t.title === "Fix auth security token bug");
    assert(created && created.priority === aiData.priority, "Task list retrieves AI-enhanced fields for frontend display");

    console.log("\n=======================================================");
    console.log(`TOTAL AI TESTS: ${passed + failed}`);
    console.log(`PASSED:         ${passed} ✅`);
    console.log(`FAILED:         ${failed} ❌`);
    console.log("=======================================================\n");

  } catch (err) {
    console.error("AI test failed with unexpected error:", err);
  } finally {
    server.close();
  }
}

runAiTests();
