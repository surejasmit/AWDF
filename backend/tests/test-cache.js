/**
 * Practical 9: In-Memory Caching Verification & Test Suite
 * Tests cache hits, cache misses, cache invalidation, and metrics.
 */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Task = require("../src/models/Task");
const cache = require("../src/utils/cache");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TEST_PORT = 5056;
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
          user: t.user,
          createdAt: t.createdAt,
          toJSON: () => ({
            id: t._id.toString(),
            title: t.title,
            completed: t.completed,
            user: t.user.toString(),
            createdAt: t.createdAt,
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
      toJSON: () => ({
        id: found._id.toString(),
        title: found.title,
        completed: found.completed,
        user: found.user.toString(),
      }),
    };
  };

  Task.prototype.save = async function () {
    const taskDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: this.title,
      completed: this.completed,
      user: this.user,
      createdAt: new Date(),
    };
    mockDb.tasks.push(taskDoc);
    return {
      _id: taskDoc._id,
      title: taskDoc.title,
      completed: taskDoc.completed,
      user: taskDoc.user,
      toJSON: () => ({
        id: taskDoc._id.toString(),
        title: taskDoc.title,
        completed: taskDoc.completed,
        user: taskDoc.user.toString(),
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
    const existing = mockDb.tasks[index];
    if (updateData.title !== undefined) existing.title = updateData.title;
    if (updateData.completed !== undefined) existing.completed = updateData.completed;
    return {
      _id: existing._id,
      title: existing.title,
      completed: existing.completed,
      user: existing.user,
      toJSON: () => ({
        id: existing._id.toString(),
        title: existing.title,
        completed: existing.completed,
        user: existing.user.toString(),
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
    return mockDb.tasks.splice(index, 1)[0];
  };
}

async function runCacheTests() {
  setupMockLayer();

  server = app.listen(TEST_PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("\n=======================================================");
  console.log("   PRACTICAL 9: IN-MEMORY CACHING VERIFICATION SUITE   ");
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
    // 1. Flush cache to start clean
    cache.flushAll();

    // 2. Register user & get JWT token
    const regRes = await request("POST", "/auth/register", {
      name: "Cache Tester",
      email: "cachetester@example.com",
      password: "Password123!",
    });
    const token = regRes.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Test initial GET /tasks -> Cache MISS
    const get1 = await request("GET", "/tasks", null, authHeaders);
    assert(get1.status === 200, "Initial GET /tasks returns 200 OK");
    assert(get1.headers["x-cache"] === "MISS", "First GET /tasks sets X-Cache: MISS header");

    // 4. Test second GET /tasks -> Cache HIT
    const get2 = await request("GET", "/tasks", null, authHeaders);
    assert(get2.status === 200, "Second GET /tasks returns 200 OK");
    assert(get2.headers["x-cache"] === "HIT", "Second GET /tasks sets X-Cache: HIT header");

    // 5. Test third GET /tasks -> Cache HIT
    const get3 = await request("GET", "/tasks", null, authHeaders);
    assert(get3.headers["x-cache"] === "HIT", "Third GET /tasks sets X-Cache: HIT header");

    // 6. Test Cache Invalidation on POST /tasks
    const postRes = await request("POST", "/tasks", { title: "Cached Task 1" }, authHeaders);
    assert(postRes.status === 201, "Create task via POST /tasks returns 201 Created");
    const taskId = postRes.body.id;

    // 7. GET /tasks immediately after POST -> Must be Cache MISS (invalidated!)
    const getAfterPost = await request("GET", "/tasks", null, authHeaders);
    assert(getAfterPost.headers["x-cache"] === "MISS", "GET /tasks after POST is MISS due to invalidation");
    assert(getAfterPost.body.length === 1, "Cached list refreshed with the new task");

    // 8. Single task endpoint caching (GET /tasks/:id)
    const singleGet1 = await request("GET", `/tasks/${taskId}`, null, authHeaders);
    assert(singleGet1.headers["x-cache"] === "MISS", "First GET /tasks/:id is MISS");

    const singleGet2 = await request("GET", `/tasks/${taskId}`, null, authHeaders);
    assert(singleGet2.headers["x-cache"] === "HIT", "Second GET /tasks/:id is HIT");

    // 9. Cache Invalidation on PUT /tasks/:id
    const putRes = await request("PUT", `/tasks/${taskId}`, { title: "Updated Task Title", completed: true }, authHeaders);
    assert(putRes.status === 200, "Update task returns 200 OK");

    const singleGetAfterPut = await request("GET", `/tasks/${taskId}`, null, authHeaders);
    assert(singleGetAfterPut.headers["x-cache"] === "MISS", "GET /tasks/:id after PUT is MISS due to invalidation");
    assert(singleGetAfterPut.body.title === "Updated Task Title", "Returns newly updated data");

    const allGetAfterPut = await request("GET", "/tasks", null, authHeaders);
    assert(allGetAfterPut.headers["x-cache"] === "MISS", "GET /tasks collection is also invalidated after PUT");

    // 10. Cache Invalidation on DELETE /tasks/:id
    const delRes = await request("DELETE", `/tasks/${taskId}`, null, authHeaders);
    assert(delRes.status === 200, "DELETE /tasks/:id returns 200 OK");

    const getAfterDel = await request("GET", "/tasks", null, authHeaders);
    assert(getAfterDel.headers["x-cache"] === "MISS", "GET /tasks after DELETE is MISS due to invalidation");
    assert(getAfterDel.body.length === 0, "Deleted item no longer present");

    // 11. Debug Cache Stats Endpoint
    const statsRes = await request("GET", "/api/cache-stats");
    assert(statsRes.status === 200, "GET /api/cache-stats returns 200 OK");
    assert(statsRes.body.caching.hits > 0, "Stats report recorded cache hits");
    assert(statsRes.body.caching.misses > 0, "Stats report recorded cache misses");
    console.log(`\n  📊 Cache Stats: Hits = ${statsRes.body.caching.hits}, Misses = ${statsRes.body.caching.misses}, Hit Ratio = ${statsRes.body.caching.hitRatio}`);

    // 12. Authenticated Cache Stats Endpoint
    const authStatsRes = await request("GET", "/tasks/cache/stats", null, authHeaders);
    assert(authStatsRes.status === 200, "GET /tasks/cache/stats returns 200 OK with auth");

    console.log("\n=======================================================");
    console.log(`TOTAL CACHE TESTS: ${passed + failed}`);
    console.log(`PASSED:            ${passed} ✅`);
    console.log(`FAILED:            ${failed} ❌`);
    console.log("=======================================================\n");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    server.close();
  }
}

runCacheTests();
