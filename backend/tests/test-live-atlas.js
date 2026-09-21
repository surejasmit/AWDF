/**
 * Live MongoDB Atlas Integration Test
 * Verifies live connection, database: 'Bank-system', collection: 'taskmanager', and REST APIs
 */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Task = require("../src/models/Task");

const TEST_PORT = 5056;
let server;

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

async function runLiveAtlasTest() {
  console.log("\n=======================================================");
  console.log("     LIVE MONGODB ATLAS INTEGRATION TEST RUNNER        ");
  console.log("=======================================================\n");

  const uri = process.env.MONGODB_URI;
  console.log("🔗 Connecting to MongoDB Atlas URI...");

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✅ Connected to MongoDB Atlas!`);
    console.log(`   Host:            ${conn.connection.host}`);
    console.log(`   Database Name:   ${conn.connection.name}`);
    console.log(`   Task Collection: ${Task.collection.name}`);

    if (conn.connection.name !== "Bank-system") {
      console.warn(`⚠️ Warning: Database name is '${conn.connection.name}', expected 'Bank-system'.`);
    }

    if (Task.collection.name !== "taskmanager") {
      console.warn(`⚠️ Warning: Task collection name is '${Task.collection.name}', expected 'taskmanager'.`);
    }

    server = app.listen(TEST_PORT);
    console.log(`🚀 Test Express server started on http://127.0.0.1:${TEST_PORT}\n`);

    let passed = 0;
    let total = 0;

    function assert(cond, name, info = "") {
      total++;
      if (cond) {
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${name} -> ${info}`);
      }
    }

    // 1. Health check reports live Atlas status
    const healthRes = await request("GET", "/health");
    assert(
      healthRes.status === 200 && healthRes.body.database.status === "connected",
      "GET /health reports live MongoDB Atlas status 'connected'",
      JSON.stringify(healthRes.body)
    );

    // 2. User registration in live Atlas
    const testEmail = `live_atlas_${Date.now()}@example.com`;
    const regRes = await request("POST", "/auth/register", {
      name: "Atlas Test User",
      email: testEmail,
      password: "AtlasPassword123!",
    });
    assert(
      regRes.status === 201 && !!regRes.body.token,
      "POST /auth/register creates user in Atlas and returns JWT",
      JSON.stringify(regRes.body)
    );
    const token = regRes.body.token;
    const userId = regRes.body.user.id;

    // 3. User Login in live Atlas
    const loginRes = await request("POST", "/auth/login", {
      email: testEmail,
      password: "AtlasPassword123!",
    });
    assert(
      loginRes.status === 200 && !!loginRes.body.token,
      "POST /auth/login authenticates user against Atlas",
      JSON.stringify(loginRes.body)
    );

    // 4. Create Task in live Atlas 'taskmanager' collection
    const createTaskRes = await request(
      "POST",
      "/tasks",
      { title: "Live Task in Atlas taskmanager collection" },
      { Authorization: `Bearer ${token}` }
    );
    assert(
      createTaskRes.status === 201 && createTaskRes.body.title === "Live Task in Atlas taskmanager collection",
      "POST /tasks inserts document into 'Bank-system.taskmanager' collection",
      JSON.stringify(createTaskRes.body)
    );
    const taskId = createTaskRes.body.id;

    // 5. Directly verify document in MongoDB collection
    const directDoc = await conn.connection.db.collection("taskmanager").findOne({ _id: new mongoose.Types.ObjectId(taskId) });
    assert(
      !!directDoc && directDoc.title === "Live Task in Atlas taskmanager collection",
      "Direct DB check: Document physically verified in 'taskmanager' collection in Atlas",
      JSON.stringify(directDoc)
    );

    // 6. Fetch tasks via REST API
    const getTasksRes = await request("GET", "/tasks", null, {
      Authorization: `Bearer ${token}`,
    });
    assert(
      getTasksRes.status === 200 && getTasksRes.body.length >= 1,
      "GET /tasks fetches tasks from Atlas with JWT authorization",
      JSON.stringify(getTasksRes.body)
    );

    // 7. Update task in live Atlas
    const updateTaskRes = await request(
      "PUT",
      `/tasks/${taskId}`,
      { completed: true, title: "Completed Task in Atlas" },
      { Authorization: `Bearer ${token}` }
    );
    assert(
      updateTaskRes.status === 200 && updateTaskRes.body.completed === true,
      "PUT /tasks/:id updates document in Atlas",
      JSON.stringify(updateTaskRes.body)
    );

    // 8. Delete task in live Atlas
    const deleteTaskRes = await request("DELETE", `/tasks/${taskId}`, null, {
      Authorization: `Bearer ${token}` }
    );
    assert(
      deleteTaskRes.status === 200 && deleteTaskRes.body.success === true,
      "DELETE /tasks/:id removes document from Atlas",
      JSON.stringify(deleteTaskRes.body)
    );

    // 9. Cleanup test user
    await User.findByIdAndDelete(userId);
    console.log("🧹 Cleaned up temporary test user record from Atlas.");

    console.log("\n=======================================================");
    console.log(`LIVE ATLAS TESTS: ${passed}/${total} PASSED ✅`);
    console.log("=======================================================\n");

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error("❌ Live MongoDB Atlas Test Error:", err);
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

runLiveAtlasTest();
