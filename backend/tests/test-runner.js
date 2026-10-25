/**
 * Comprehensive Automated API & Integration Test Suite
 * Tests all endpoints: Health, Authentication, Authorization, Task CRUD, Isolation & Edge Cases
 */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Task = require("../src/models/Task");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TEST_PORT = process.env.TEST_PORT || 5055;
let server;

// In-Memory storage for isolated mock database when standalone Mongo is not running
const mockDb = {
  users: [],
  tasks: [],
};

// Helper to make HTTP requests
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

function setupInMemoryMongoMock() {
  console.log("⚡ Initializing fast in-memory MongoDB mock layer for automated testing...");

  // Override User methods
  User.findOne = async function (filter) {
    if (filter.email) {
      const found = mockDb.users.find((u) => u.email === filter.email.toLowerCase());
      if (!found) return null;
      return createMockUserDoc(found);
    }
    if (filter._id) {
      const found = mockDb.users.find((u) => u._id.toString() === filter._id.toString());
      if (!found) return null;
      return createMockUserDoc(found);
    }
    return null;
  };

  User.findById = async function (id) {
    const found = mockDb.users.find((u) => u._id.toString() === id.toString());
    if (!found) return null;
    return createMockUserDoc(found);
  };

  const createMockUserDoc = (data) => ({
    _id: data._id,
    name: data.name,
    email: data.email,
    password: data.password,
    createdAt: data.createdAt,
    comparePassword: async function (candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    },
    toJSON: function () {
      return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        createdAt: this.createdAt,
      };
    },
  });

  const origUserSave = User.prototype.save;
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

  // Override Task methods
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
          user: t.user,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          toJSON: () => ({
            id: t._id.toString(),
            title: t.title,
            text: t.title,
            completed: t.completed,
            user: t.user.toString(),
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }),
        })),
    };
  };

  Task.findOne = async function (filter) {
    const found = mockDb.tasks.find((t) => {
      let match = true;
      if (filter._id) match = match && t._id.toString() === filter._id.toString();
      if (filter.user) match = match && t.user.toString() === filter.user.toString();
      return match;
    });
    if (!found) return null;
    return {
      _id: found._id,
      title: found.title,
      completed: found.completed,
      user: found.user,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      toJSON: () => ({
        id: found._id.toString(),
        title: found.title,
        text: found.title,
        completed: found.completed,
        user: found.user.toString(),
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
      }),
    };
  };

  Task.findOneAndUpdate = async function (filter, updateData) {
    const index = mockDb.tasks.findIndex((t) => {
      let match = true;
      if (filter._id) match = match && t._id.toString() === filter._id.toString();
      if (filter.user) match = match && t.user.toString() === filter.user.toString();
      return match;
    });

    if (index === -1) return null;

    if (updateData.title !== undefined) mockDb.tasks[index].title = updateData.title;
    if (updateData.completed !== undefined) mockDb.tasks[index].completed = updateData.completed;
    mockDb.tasks[index].updatedAt = new Date();

    const updated = mockDb.tasks[index];
    return {
      _id: updated._id,
      title: updated.title,
      completed: updated.completed,
      user: updated.user,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      toJSON: () => ({
        id: updated._id.toString(),
        title: updated.title,
        text: updated.title,
        completed: updated.completed,
        user: updated.user.toString(),
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      }),
    };
  };

  Task.findOneAndDelete = async function (filter) {
    const index = mockDb.tasks.findIndex((t) => {
      let match = true;
      if (filter._id) match = match && t._id.toString() === filter._id.toString();
      if (filter.user) match = match && t.user.toString() === filter.user.toString();
      return match;
    });

    if (index === -1) return null;
    const deleted = mockDb.tasks.splice(index, 1)[0];
    return deleted;
  };

  Task.prototype.save = async function () {
    const taskDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: this.title,
      completed: this.completed || false,
      user: this.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.tasks.push(taskDoc);
    return {
      _id: taskDoc._id,
      title: taskDoc.title,
      completed: taskDoc.completed,
      user: taskDoc.user,
      createdAt: taskDoc.createdAt,
      updatedAt: taskDoc.updatedAt,
      toJSON: () => ({
        id: taskDoc._id.toString(),
        title: taskDoc.title,
        text: taskDoc.title,
        completed: taskDoc.completed,
        user: taskDoc.user.toString(),
        createdAt: taskDoc.createdAt,
        updatedAt: taskDoc.updatedAt,
      }),
    };
  };
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("       TASK MANAGEMENT API AUTOMATED TEST SUITE        ");
  console.log("=======================================================\n");

  // If real MongoDB is not connected, setup mock
  if (mongoose.connection.readyState !== 1) {
    setupInMemoryMongoMock();
  }

  server = app.listen(TEST_PORT);
  console.log(`🧪 Test Server running on http://127.0.0.1:${TEST_PORT}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  function assert(condition, category, testName, details = "") {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] [${category}] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] [${category}] ${testName} -> ${details}`);
      failedTests++;
      failures.push({ category, testName, details });
    }
  }

  const timestamp = Date.now();
  const userA = {
    name: "User Alpha",
    email: `alpha_${timestamp}@example.com`,
    password: "Password123!",
  };
  const userB = {
    name: "User Beta",
    email: `beta_${timestamp}@example.com`,
    password: "Password456!",
  };

  let tokenA = null;
  let tokenB = null;
  let taskAId = null;
  let taskBId = null;

  try {
    // -------------------------------------------------------------
    // CATEGORY A: HEALTH & READINESS CHECKS
    // -------------------------------------------------------------
    console.log("\n--- [Category A: Health & Readiness Endpoints] ---");

    const rootRes = await request("GET", "/");
    assert(
      rootRes.status === 200 && rootRes.body.status === "online",
      "HEALTH",
      "GET / returns 200 OK and online status",
      `Got status ${rootRes.status}`
    );

    const healthRes = await request("GET", "/health");
    assert(
      (healthRes.status === 200 || healthRes.status === 503) && !!healthRes.body.database,
      "HEALTH",
      "GET /health returns system status and MongoDB info",
      `Got status ${healthRes.status}`
    );

    const apiHealthRes = await request("GET", "/api/health");
    assert(
      apiHealthRes.status === healthRes.status,
      "HEALTH",
      "GET /api/health alias returns identical status",
      `Got status ${apiHealthRes.status}`
    );

    // -------------------------------------------------------------
    // CATEGORY B: AUTHENTICATION VALIDATION & GUARDS
    // -------------------------------------------------------------
    console.log("\n--- [Category B: User Registration & Login Validation] ---");

    // 1. Missing name
    const regNoName = await request("POST", "/auth/register", {
      email: userA.email,
      password: userA.password,
    });
    assert(
      regNoName.status === 400 && regNoName.body.message.includes("Name is required"),
      "AUTH",
      "Reject registration missing 'name'",
      JSON.stringify(regNoName.body)
    );

    // 2. Short name (< 2 chars)
    const regShortName = await request("POST", "/auth/register", {
      name: "A",
      email: userA.email,
      password: userA.password,
    });
    assert(
      regShortName.status === 400 && regShortName.body.message.includes("at least 2 characters"),
      "AUTH",
      "Reject registration with name < 2 characters",
      JSON.stringify(regShortName.body)
    );

    // 3. Missing email
    const regNoEmail = await request("POST", "/auth/register", {
      name: userA.name,
      password: userA.password,
    });
    assert(
      regNoEmail.status === 400 && regNoEmail.body.message.includes("Email is required"),
      "AUTH",
      "Reject registration missing 'email'",
      JSON.stringify(regNoEmail.body)
    );

    // 4. Invalid email format
    const regBadEmail = await request("POST", "/auth/register", {
      name: userA.name,
      email: "invalid-email-string",
      password: userA.password,
    });
    assert(
      regBadEmail.status === 400 && regBadEmail.body.message.includes("Invalid email format"),
      "AUTH",
      "Reject registration with malformed email",
      JSON.stringify(regBadEmail.body)
    );

    // 5. Short password (< 6 chars)
    const regShortPass = await request("POST", "/auth/register", {
      name: userA.name,
      email: userA.email,
      password: "123",
    });
    assert(
      regShortPass.status === 400 && regShortPass.body.message.includes("at least 6 characters"),
      "AUTH",
      "Reject registration with short password",
      JSON.stringify(regShortPass.body)
    );

    // 6. Login with missing credentials
    const loginNoEmail = await request("POST", "/auth/login", {
      password: userA.password,
    });
    assert(
      loginNoEmail.status === 400 && loginNoEmail.body.message.includes("Email is required"),
      "AUTH",
      "Reject login with missing email",
      JSON.stringify(loginNoEmail.body)
    );

    const loginNoPass = await request("POST", "/auth/login", {
      email: userA.email,
    });
    assert(
      loginNoPass.status === 400 && loginNoPass.body.message.includes("Password is required"),
      "AUTH",
      "Reject login with missing password",
      JSON.stringify(loginNoPass.body)
    );

    // -------------------------------------------------------------
    // CATEGORY C: AUTHORIZATION & JWT VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- [Category C: Authorization & Token Verification] ---");

    // Access /tasks without header
    const noTokenRes = await request("GET", "/tasks");
    assert(
      noTokenRes.status === 401 && noTokenRes.body.message.includes("No authentication token"),
      "SECURITY",
      "Reject GET /tasks without Authorization header (401)",
      JSON.stringify(noTokenRes.body)
    );

    // Access /tasks with invalid token format
    const badTokenRes = await request("GET", "/tasks", null, {
      Authorization: "Bearer invalid.jwt.payload",
    });
    assert(
      badTokenRes.status === 401 && badTokenRes.body.message.includes("Invalid authentication token"),
      "SECURITY",
      "Reject GET /tasks with malformed JWT token (401)",
      JSON.stringify(badTokenRes.body)
    );

    // Access /auth/me without token
    const noTokenMe = await request("GET", "/auth/me");
    assert(
      noTokenMe.status === 401,
      "SECURITY",
      "Reject GET /auth/me without token (401)",
      JSON.stringify(noTokenMe.body)
    );

    // -------------------------------------------------------------
    // CATEGORY D: DATABASE-BACKED AUTH & CRUD
    // -------------------------------------------------------------
    console.log("\n--- [Category D: Database Authentication & CRUD Operations] ---");

    // Register User Alpha
    const regSuccessA = await request("POST", "/auth/register", userA);
    assert(
      regSuccessA.status === 201 &&
        !!regSuccessA.body.token &&
        regSuccessA.body.user.email === userA.email.toLowerCase() &&
        !regSuccessA.body.user.password,
      "AUTH",
      "Register User Alpha: returns 201, JWT token, and strips password",
      JSON.stringify(regSuccessA.body)
    );
    tokenA = regSuccessA.body.token;

    // Duplicate registration check
    const regDup = await request("POST", "/auth/register", userA);
    assert(
      regDup.status === 400 && regDup.body.message.includes("already exists"),
      "AUTH",
      "Reject duplicate email registration with 400 Bad Request",
      JSON.stringify(regDup.body)
    );

    // Register User Beta
    const regSuccessB = await request("POST", "/auth/register", userB);
    assert(
      regSuccessB.status === 201 && !!regSuccessB.body.token,
      "AUTH",
      "Register User Beta: returns 201 and valid token",
      JSON.stringify(regSuccessB.body)
    );
    tokenB = regSuccessB.body.token;

    // Login wrong password
    const loginWrongPass = await request("POST", "/auth/login", {
      email: userA.email,
      password: "WrongPassword999",
    });
    assert(
      loginWrongPass.status === 401 && loginWrongPass.body.message.includes("Invalid email or password"),
      "AUTH",
      "Reject login with incorrect password (401)",
      JSON.stringify(loginWrongPass.body)
    );

    // Successful Login
    const loginSuccess = await request("POST", "/auth/login", {
      email: userA.email,
      password: userA.password,
    });
    assert(
      loginSuccess.status === 200 &&
        !!loginSuccess.body.token &&
        loginSuccess.body.user.email === userA.email.toLowerCase(),
      "AUTH",
      "Successful login returns 200 OK and valid JWT token",
      JSON.stringify(loginSuccess.body)
    );

    // Get Profile (GET /auth/me) with token
    const profileRes = await request("GET", "/auth/me", null, {
      Authorization: `Bearer ${tokenA}`,
    });
    assert(
      profileRes.status === 200 && profileRes.body.user.email === userA.email.toLowerCase(),
      "AUTH",
      "GET /auth/me returns authenticated user profile",
      JSON.stringify(profileRes.body)
    );

    // Task creation missing title
    const taskNoTitle = await request(
      "POST",
      "/tasks",
      { completed: false },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(
      taskNoTitle.status === 400 && taskNoTitle.body.message.includes("Task title is required"),
      "CRUD",
      "Reject task creation with missing title (400)",
      JSON.stringify(taskNoTitle.body)
    );

    // Create Task 1 for User Alpha
    const createTaskARes = await request(
      "POST",
      "/tasks",
      { title: "Task Alpha 1 - MongoDB Schema Design" },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(
      createTaskARes.status === 201 &&
        createTaskARes.body.title === "Task Alpha 1 - MongoDB Schema Design" &&
        createTaskARes.body.completed === false,
      "CRUD",
      "User Alpha creates Task 1 (201 Created)",
      JSON.stringify(createTaskARes.body)
    );
    taskAId = createTaskARes.body.id || createTaskARes.body._id;

    // Create Task for User Beta
    const createTaskBRes = await request(
      "POST",
      "/tasks",
      { title: "Task Beta 1 - Frontend Architecture" },
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(
      createTaskBRes.status === 201 && createTaskBRes.body.title === "Task Beta 1 - Frontend Architecture",
      "CRUD",
      "User Beta creates Task 1 (201 Created)",
      JSON.stringify(createTaskBRes.body)
    );
    taskBId = createTaskBRes.body.id || createTaskBRes.body._id;

    // User A fetches tasks
    const getTasksARes = await request("GET", "/tasks", null, {
      Authorization: `Bearer ${tokenA}`,
    });
    assert(
      getTasksARes.status === 200 &&
        Array.isArray(getTasksARes.body) &&
        getTasksARes.body.length === 1 &&
        getTasksARes.body[0].id === taskAId,
      "CRUD",
      "User Alpha fetches their task list (200 OK)",
      JSON.stringify(getTasksARes.body)
    );

    // User A fetches task by ID
    const getTaskByIdRes = await request("GET", `/tasks/${taskAId}`, null, {
      Authorization: `Bearer ${tokenA}`,
    });
    assert(
      getTaskByIdRes.status === 200 && getTaskByIdRes.body.id === taskAId,
      "CRUD",
      "User Alpha fetches single task by ID (200 OK)",
      JSON.stringify(getTaskByIdRes.body)
    );

    // User A updates task
    const updateTaskRes = await request(
      "PUT",
      `/tasks/${taskAId}`,
      { title: "Task Alpha 1 - Completed Architecture", completed: true },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(
      updateTaskRes.status === 200 &&
        updateTaskRes.body.completed === true &&
        updateTaskRes.body.title === "Task Alpha 1 - Completed Architecture",
      "CRUD",
      "User Alpha updates task title & completed status (200 OK)",
      JSON.stringify(updateTaskRes.body)
    );

    // User A updates task via PATCH
    const patchTaskRes = await request(
      "PATCH",
      `/tasks/${taskAId}`,
      { completed: false },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(
      patchTaskRes.status === 200 && patchTaskRes.body.completed === false,
      "CRUD",
      "User Alpha updates task via PATCH (200 OK)",
      JSON.stringify(patchTaskRes.body)
    );

    // -------------------------------------------------------------
    // CATEGORY E: USER ISOLATION
    // -------------------------------------------------------------
    console.log("\n--- [Category E: User Data Isolation] ---");

    // User B cannot read User A's task -> 404
    const userBAccessTaskA = await request("GET", `/tasks/${taskAId}`, null, {
      Authorization: `Bearer ${tokenB}`,
    });
    assert(
      userBAccessTaskA.status === 404,
      "ISOLATION",
      "User Beta CANNOT view User Alpha's task (404 Not Found)",
      `Status: ${userBAccessTaskA.status}`
    );

    // User B cannot update User A's task -> 404
    const userBUpdateTaskA = await request(
      "PUT",
      `/tasks/${taskAId}`,
      { title: "Hacked by Beta" },
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(
      userBUpdateTaskA.status === 404,
      "ISOLATION",
      "User Beta CANNOT modify User Alpha's task (404 Not Found)",
      `Status: ${userBUpdateTaskA.status}`
    );

    // User B cannot delete User A's task -> 404
    const userBDeleteTaskA = await request("DELETE", `/tasks/${taskAId}`, null, {
      Authorization: `Bearer ${tokenB}`,
    });
    assert(
      userBDeleteTaskA.status === 404,
      "ISOLATION",
      "User Beta CANNOT delete User Alpha's task (404 Not Found)",
      `Status: ${userBDeleteTaskA.status}`
    );

    // Delete task by User A
    const deleteSuccessRes = await request("DELETE", `/tasks/${taskAId}`, null, {
      Authorization: `Bearer ${tokenA}`,
    });
    assert(
      deleteSuccessRes.status === 200 && deleteSuccessRes.body.success === true,
      "CRUD",
      "User Alpha successfully deletes their own task (200 OK)",
      JSON.stringify(deleteSuccessRes.body)
    );

    // Verify task is gone
    const verifyDeletedRes = await request("GET", `/tasks/${taskAId}`, null, {
      Authorization: `Bearer ${tokenA}`,
    });
    assert(
      verifyDeletedRes.status === 404,
      "CRUD",
      "Deleted task is no longer retrievable (404 Not Found)",
      `Status: ${verifyDeletedRes.status}`
    );

    // Cleanup User B's task
    await request("DELETE", `/tasks/${taskBId}`, null, {
      Authorization: `Bearer ${tokenB}`,
    });

    // -------------------------------------------------------------
    // CATEGORY F: EDGE CASES & GENERAL ERROR HANDLING
    // -------------------------------------------------------------
    console.log("\n--- [Category F: Edge Cases & Validation] ---");

    const testToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), email: "edge@example.com", name: "Edge Tester" },
      process.env.JWT_SECRET || "super_secret_jwt_key_development_change_in_prod",
      { expiresIn: "1h" }
    );

    // Invalid ObjectId format -> 400
    const invalidIdRes = await request("GET", "/tasks/not-a-valid-object-id", null, {
      Authorization: `Bearer ${testToken}`,
    });
    assert(
      invalidIdRes.status === 400 && invalidIdRes.body.message.includes("Invalid resource ID"),
      "EDGE_CASES",
      "Reject invalid MongoDB ObjectId in path with 400 Bad Request",
      JSON.stringify(invalidIdRes.body)
    );

    // Empty task update body -> 400
    const emptyUpdateRes = await request(
      "PUT",
      `/tasks/${new mongoose.Types.ObjectId().toString()}`,
      {},
      { Authorization: `Bearer ${testToken}` }
    );
    assert(
      emptyUpdateRes.status === 400 && emptyUpdateRes.body.message.includes("At least one field"),
      "EDGE_CASES",
      "Reject empty update payload with 400 Bad Request",
      JSON.stringify(emptyUpdateRes.body)
    );

    // 404 on unknown endpoint
    const unknownRouteRes = await request("GET", "/api/unknown-endpoint");
    assert(
      unknownRouteRes.status === 404 && unknownRouteRes.body.message.includes("Endpoint not found"),
      "EDGE_CASES",
      "Unmatched route returns standard 404 response",
      JSON.stringify(unknownRouteRes.body)
    );

    console.log("\n=======================================================");
    console.log(`TOTAL TESTS:   ${totalTests}`);
    console.log(`PASSED:        ${passedTests} ✅`);
    console.log(`FAILED:        ${failedTests} ❌`);
    console.log("=======================================================\n");

    if (failedTests > 0) {
      console.error("FAILURES SUMMARY:");
      failures.forEach((f, idx) => {
        console.error(`${idx + 1}. [${f.category}] ${f.testName}: ${f.details}`);
      });
    }
  } catch (err) {
    console.error("Fatal Test Runner Error:", err);
    failedTests++;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(failedTests === 0 ? 0 : 1);
  }
}

runAllTests();
