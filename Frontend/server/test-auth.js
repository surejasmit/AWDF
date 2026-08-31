/**
 * Comprehensive verification script for Auth, JWT, Middleware & Validation
 */
const http = require("http");
const app = require("./server");

const PORT = 5055;
let server;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
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

async function runTests() {
  server = app.listen(PORT);
  console.log(`\n=== Starting Auth & Task Security Verification on port ${PORT} ===\n`);

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, testName, details = "") {
    testsTotal++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details}`);
    }
  }

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "password123";
  let authToken = null;
  let createdTaskId = null;

  try {
    // 1. Validation: Registration with missing name
    const regNoName = await request("POST", "/auth/register", {
      email: testEmail,
      password: testPassword,
    });
    assert(
      regNoName.status === 400 && regNoName.body.message.includes("Name is required"),
      "Server rejects registration missing name (400 Bad Request)"
    );

    // 2. Validation: Registration with invalid email format
    const regBadEmail = await request("POST", "/auth/register", {
      name: "Test User",
      email: "not-an-email",
      password: testPassword,
    });
    assert(
      regBadEmail.status === 400 && regBadEmail.body.message.includes("Invalid email format"),
      "Server rejects registration with invalid email format (400 Bad Request)"
    );

    // 3. Validation: Registration with short password (< 6 chars)
    const regShortPass = await request("POST", "/auth/register", {
      name: "Test User",
      email: testEmail,
      password: "123",
    });
    assert(
      regShortPass.status === 400 && regShortPass.body.message.includes("at least 6 characters"),
      "Server rejects registration with short password (400 Bad Request)"
    );

    // 4. Successful User Registration
    const regSuccess = await request("POST", "/auth/register", {
      name: "Test User",
      email: testEmail,
      password: testPassword,
    });
    assert(
      regSuccess.status === 201 && !!regSuccess.body.token && regSuccess.body.user.email === testEmail,
      "User registered successfully with bcrypt password hashing & returns JWT token"
    );

    // 5. Duplicate Registration Check
    const regDup = await request("POST", "/auth/register", {
      name: "Duplicate User",
      email: testEmail,
      password: testPassword,
    });
    assert(
      regDup.status === 400 && regDup.body.message.includes("already exists"),
      "Server rejects duplicate email registration (400 Bad Request)"
    );

    // 6. Login with Wrong Password
    const loginWrong = await request("POST", "/auth/login", {
      email: testEmail,
      password: "wrongpassword",
    });
    assert(
      loginWrong.status === 401 && loginWrong.body.message.includes("Invalid email or password"),
      "Server rejects login with invalid password (401 Unauthorized)"
    );

    // 7. Successful Login with Valid Credentials
    const loginSuccess = await request("POST", "/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    assert(
      loginSuccess.status === 200 && !!loginSuccess.body.token,
      "User login succeeds and returns valid JWT token"
    );
    authToken = loginSuccess.body.token;

    // 8. Auth Middleware: Access /tasks without token -> 401
    const noTokenTasks = await request("GET", "/tasks");
    assert(
      noTokenTasks.status === 401 && noTokenTasks.body.message.includes("Access denied"),
      "Auth middleware blocks unauthenticated GET /tasks (401 Unauthorized)"
    );

    // 9. Auth Middleware: Access /tasks with invalid token -> 401
    const badTokenTasks = await request("GET", "/tasks", null, {
      Authorization: "Bearer invalid.token.payload",
    });
    assert(
      badTokenTasks.status === 401 && badTokenTasks.body.message.includes("Invalid authentication token"),
      "Auth middleware blocks invalid JWT token (401 Unauthorized)"
    );

    // 10. Server-Side Input Validation: Task creation missing title -> 400
    const noTitleTask = await request(
      "POST",
      "/tasks",
      { completed: false },
      { Authorization: `Bearer ${authToken}` }
    );
    assert(
      noTitleTask.status === 400 && noTitleTask.body.message.includes("Task title is required"),
      "Server-side input validation rejects task without title (400 Bad Request)"
    );

    // 11. Create Task with Valid JWT and Title -> 201
    const createTaskRes = await request(
      "POST",
      "/tasks",
      { title: "Complete Security Requirements" },
      { Authorization: `Bearer ${authToken}` }
    );
    assert(
      createTaskRes.status === 201 && createTaskRes.body.title === "Complete Security Requirements",
      "Authenticated user can create a task (201 Created)"
    );
    createdTaskId = createTaskRes.body.id;

    // 12. Fetch Tasks with Valid JWT -> 200
    const getTasksRes = await request("GET", "/tasks", null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert(
      getTasksRes.status === 200 && Array.isArray(getTasksRes.body) && getTasksRes.body.length > 0,
      "Authenticated user can retrieve their tasks (200 OK)"
    );

    // 13. Update Task with Valid JWT -> 200
    const updateTaskRes = await request(
      "PUT",
      `/tasks/${createdTaskId}`,
      { completed: true },
      { Authorization: `Bearer ${authToken}` }
    );
    assert(
      updateTaskRes.status === 200 && updateTaskRes.body.completed === true,
      "Authenticated user can update task status (200 OK)"
    );

    // 14. Delete Task with Valid JWT -> 200
    const deleteTaskRes = await request("DELETE", `/tasks/${createdTaskId}`, null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert(
      deleteTaskRes.status === 200 && deleteTaskRes.body.success === true,
      "Authenticated user can delete their task (200 OK)"
    );

    console.log(`\n=== Verification Complete: ${testsPassed}/${testsTotal} Passed ===\n`);
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    server.close();
    process.exit(testsPassed === testsTotal ? 0 : 1);
  }
}

runTests();
