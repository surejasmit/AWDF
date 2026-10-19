/**
 * Practical 10: Event-Driven Architecture & Asynchronous Processing Test Suite
 * Tests EventBus, domain event dispatch, decoupled subscribers, and async job queues.
 */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Task = require("../src/models/Task");
const { eventBus, EVENTS } = require("../src/events/eventBus");
const { jobQueueService } = require("../src/services/jobQueueService");
const cache = require("../src/utils/cache");
const bcrypt = require("bcryptjs");

const TEST_PORT = 5058;
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

async function runEventTests() {
  setupMockLayer();

  server = app.listen(TEST_PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("\n=======================================================");
  console.log("   EVENT-DRIVEN ARCHITECTURE & ASYNC PROCESSING TESTS  ");
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
    // Clean slate
    cache.flushAll();
    jobQueueService.clear();

    // 1. Direct EventBus publish & subscribe test
    let receivedPayload = null;
    const unsubscribe = eventBus.subscribe("test.event", (payload) => {
      receivedPayload = payload;
    });

    eventBus.publish("test.event", { message: "Hello EventBus" });
    await new Promise((r) => setTimeout(r, 50));
    assert(receivedPayload && receivedPayload.message === "Hello EventBus", "EventBus dispatches and delivers event payload to subscriber");
    assert(receivedPayload._eventId && receivedPayload._timestamp, "EventBus automatically enriches event with _eventId and _timestamp");
    unsubscribe();

    // 2. Register User Alpha and verify USER_REGISTERED event
    let capturedUserRegistered = null;
    eventBus.subscribe(EVENTS.USER_REGISTERED, ({ user }) => {
      capturedUserRegistered = user;
    });

    const regAlpha = await request("POST", "/auth/register", {
      name: "Alice Events",
      email: "alice.events@example.com",
      password: "Password123!",
    });
    assert(regAlpha.status === 201, "Register Alice returns 201 Created");
    await new Promise((r) => setTimeout(r, 50));
    assert(capturedUserRegistered && capturedUserRegistered.email === "alice.events@example.com", "USER_REGISTERED domain event published upon user registration");

    const tokenAlpha = regAlpha.body.token;
    const authHeadersAlpha = { Authorization: `Bearer ${tokenAlpha}` };

    // Register User Beta for isolation testing
    const regBeta = await request("POST", "/auth/register", {
      name: "Bob Events",
      email: "bob.events@example.com",
      password: "Password123!",
    });
    const tokenBeta = regBeta.body.token;
    const authHeadersBeta = { Authorization: `Bearer ${tokenBeta}` };

    // 3. Create Task & verify TASK_CREATED domain event
    let capturedTaskCreated = null;
    eventBus.subscribe(EVENTS.TASK_CREATED, ({ task }) => {
      capturedTaskCreated = task;
    });

    const createRes = await request("POST", "/tasks", { title: "Async Architecture Task" }, authHeadersAlpha);
    assert(createRes.status === 201, "Create task returns 201 Created");
    const taskId = createRes.body.id;
    await new Promise((r) => setTimeout(r, 50));
    assert(capturedTaskCreated && capturedTaskCreated.title === "Async Architecture Task", "TASK_CREATED domain event published upon task creation");

    // 4. Update Task & verify TASK_UPDATED domain event
    let capturedTaskUpdated = null;
    eventBus.subscribe(EVENTS.TASK_UPDATED, ({ task }) => {
      capturedTaskUpdated = task;
    });

    const updateRes = await request("PUT", `/tasks/${taskId}`, { title: "Updated Task Title", completed: true }, authHeadersAlpha);
    assert(updateRes.status === 200, "Update task returns 200 OK");
    await new Promise((r) => setTimeout(r, 50));
    assert(capturedTaskUpdated && capturedTaskUpdated.completed === true, "TASK_UPDATED domain event published upon task update");

    // 5. Delete Task & verify TASK_DELETED domain event
    let capturedTaskDeleted = null;
    eventBus.subscribe(EVENTS.TASK_DELETED, ({ taskId: id }) => {
      capturedTaskDeleted = id;
    });

    const delRes = await request("DELETE", `/tasks/${taskId}`, null, authHeadersAlpha);
    assert(delRes.status === 200, "Delete task returns 200 OK");
    await new Promise((r) => setTimeout(r, 50));
    assert(capturedTaskDeleted === taskId, "TASK_DELETED domain event published upon task deletion");

    // 6. Asynchronous Job Submission (POST /api/jobs/export -> 202 Accepted)
    // Seed 2 tasks for Alice
    await request("POST", "/tasks", { title: "Task 1 For Export" }, authHeadersAlpha);
    await request("POST", "/tasks", { title: "Task 2 For Export" }, authHeadersAlpha);

    const exportJobRes = await request("POST", "/api/jobs/export", {}, authHeadersAlpha);
    assert(exportJobRes.status === 202, "POST /api/jobs/export returns HTTP 202 Accepted immediately");
    assert(exportJobRes.body.jobId, "Response contains unique jobId");
    assert(exportJobRes.body.statusUrl, "Response contains status polling URL");
    const exportJobId = exportJobRes.body.jobId;

    // 7. Poll Job Status (GET /api/jobs/:id) until completed
    let exportJobStatus = null;
    for (let attempts = 0; attempts < 10; attempts++) {
      const pollRes = await request("GET", `/api/jobs/${exportJobId}`, null, authHeadersAlpha);
      exportJobStatus = pollRes.body.job;
      if (exportJobStatus && exportJobStatus.status === "completed") {
        break;
      }
      await new Promise((r) => setTimeout(r, 60));
    }

    assert(exportJobStatus && exportJobStatus.status === "completed", "Background worker transitioned export job to 'completed'");
    assert(exportJobStatus.progress === 100, "Completed job progress reaches 100%");
    assert(exportJobStatus.result && exportJobStatus.result.summary.totalTasks === 2, "Export result contains correct task summary count");

    // 8. Batch Task Creation Job (POST /api/jobs/batch-create -> 202 Accepted)
    const batchJobRes = await request(
      "POST",
      "/api/jobs/batch-create",
      { items: ["Batch Task A", "Batch Task B", "Batch Task C"] },
      authHeadersAlpha
    );
    assert(batchJobRes.status === 202, "POST /api/jobs/batch-create returns 202 Accepted");
    const batchJobId = batchJobRes.body.jobId;

    let batchJobStatus = null;
    for (let attempts = 0; attempts < 10; attempts++) {
      const pollRes = await request("GET", `/api/jobs/${batchJobId}`, null, authHeadersAlpha);
      batchJobStatus = pollRes.body.job;
      if (batchJobStatus && batchJobStatus.status === "completed") {
        break;
      }
      await new Promise((r) => setTimeout(r, 60));
    }

    assert(batchJobStatus && batchJobStatus.status === "completed", "Batch creation worker finished processing all items");
    assert(batchJobStatus.result && batchJobStatus.result.createdCount === 3, "Batch creation result reports 3 tasks created");

    // 9. Job Isolation: Bob CANNOT access Alice's job
    const unauthorizedJobRes = await request("GET", `/api/jobs/${exportJobId}`, null, authHeadersBeta);
    assert(unauthorizedJobRes.status === 404, "User Beta cannot access User Alpha's background job (404 Not Found)");

    // 10. List User Jobs (GET /api/jobs)
    const listJobsRes = await request("GET", "/api/jobs", null, authHeadersAlpha);
    assert(listJobsRes.status === 200, "GET /api/jobs returns 200 OK");
    assert(listJobsRes.body.count >= 2, "Alice sees all background jobs submitted by her");

    // 11. Queue Metrics Endpoint (GET /api/jobs/metrics)
    const queueMetricsRes = await request("GET", "/api/jobs/metrics");
    assert(queueMetricsRes.status === 200, "GET /api/jobs/metrics returns 200 OK");
    assert(queueMetricsRes.body.data.completed >= 2, "Queue metrics correctly record completed jobs");

    // 12. Event Telemetry Endpoint (GET /api/activities/metrics)
    const eventMetricsRes = await request("GET", "/api/activities/metrics");
    assert(eventMetricsRes.status === 200, "GET /api/activities/metrics returns 200 OK");
    assert(eventMetricsRes.body.data.publishedCount > 0, "Event metrics record published domain events");
    console.log(`\n  📊 Event Telemetry: Published = ${eventMetricsRes.body.data.publishedCount}, Processed = ${eventMetricsRes.body.data.processedCount}`);
    console.log(`  📊 Job Queue Stats: Total = ${queueMetricsRes.body.data.totalJobs}, Completed = ${queueMetricsRes.body.data.completed}, Active = ${queueMetricsRes.body.data.activeWorkers}`);

    console.log("\n=======================================================");
    console.log(`TOTAL EDA & ASYNC TESTS: ${passed + failed}`);
    console.log(`PASSED:                  ${passed} ✅`);
    console.log(`FAILED:                  ${failed} ❌`);
    console.log("=======================================================\n");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    server.close();
  }
}

runEventTests();
