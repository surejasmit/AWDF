/**
 * Practical 9: Cache Response Time Benchmark Script
 * Measures and compares API response times with and without in-memory caching.
 */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Task = require("../src/models/Task");
const cache = require("../src/utils/cache");
const bcrypt = require("bcryptjs");

const BENCHMARK_PORT = 5057;
let server;

const mockDb = {
  users: [],
  tasks: [],
};

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const startTime = process.hrtime.bigint();

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: BENCHMARK_PORT,
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
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1e6; // Convert nanoseconds to milliseconds
          try {
            const json = responseBody ? JSON.parse(responseBody) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: json,
              durationMs: parseFloat(durationMs.toFixed(2)),
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: responseBody,
              durationMs: parseFloat(durationMs.toFixed(2)),
            });
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
    // Simulate typical production database query latency (8 - 15ms)
    const startTime = Date.now();
    while (Date.now() - startTime < 12) {}

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
}

async function runBenchmark() {
  setupMockLayer();

  server = app.listen(BENCHMARK_PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("\n=======================================================");
  console.log("   PRACTICAL 9: API RESPONSE TIME BENCHMARK REPORT    ");
  console.log("=======================================================\n");

  try {
    // 1. Setup user and sample tasks
    const regRes = await request("POST", "/auth/register", {
      name: "Benchmark User",
      email: "bench@example.com",
      password: "Password123!",
    });
    const authHeaders = { Authorization: `Bearer ${regRes.body.token}` };

    // Seed 10 tasks to create a realistic payload
    for (let i = 1; i <= 10; i++) {
      await request("POST", "/tasks", { title: `Performance Test Task #${i}` }, authHeaders);
    }

    const uncachedReadings = [];
    const cachedReadings = [];

    // --- PHASE 1: UNCACHED (Cache Disabled / Constant Invalidation) ---
    console.log("Measuring Uncached Requests (MongoDB Query Simulated)...");
    for (let i = 1; i <= 5; i++) {
      cache.flushAll(); // Flush before each request to guarantee a cache MISS
      const res = await request("GET", "/tasks", null, authHeaders);
      uncachedReadings.push(res.durationMs);
      console.log(`  Uncached Run #${i}: ${res.durationMs} ms (X-Cache: ${res.headers["x-cache"]})`);
    }

    // --- PHASE 2: CACHED (In-Memory node-cache HIT) ---
    console.log("\nMeasuring Cached Requests (node-cache HIT)...");
    // Warm up the cache once
    await request("GET", "/tasks", null, authHeaders);

    for (let i = 1; i <= 5; i++) {
      const res = await request("GET", "/tasks", null, authHeaders);
      cachedReadings.push(res.durationMs);
      console.log(`  Cached Run #${i}:   ${res.durationMs} ms (X-Cache: ${res.headers["x-cache"]})`);
    }

    // Calculations
    const avgUncached = (uncachedReadings.reduce((a, b) => a + b, 0) / uncachedReadings.length).toFixed(2);
    const avgCached = (cachedReadings.reduce((a, b) => a + b, 0) / cachedReadings.length).toFixed(2);
    const speedup = (avgUncached / avgCached).toFixed(1);
    const reductionPercent = (((avgUncached - avgCached) / avgUncached) * 100).toFixed(1);

    console.log("\n=======================================================");
    console.log("                BENCHMARK RESULTS TABLE                ");
    console.log("=======================================================");
    console.log("| Request # | Uncached (Database Read) | Cached (node-cache HIT) | Speedup Factor |");
    console.log("|:---------:|:------------------------:|:-----------------------:|:--------------:|");
    for (let i = 0; i < 3; i++) {
      const ratio = (uncachedReadings[i] / cachedReadings[i]).toFixed(1);
      console.log(`| Reading ${i + 1} | ${uncachedReadings[i]} ms                  | ${cachedReadings[i]} ms                 | ${ratio}x faster     |`);
    }
    console.log(`| **AVG**   | **${avgUncached} ms**              | **${avgCached} ms**              | **${speedup}x faster** |`);
    console.log("=======================================================");
    console.log(`🚀 Latency Reduction: ${reductionPercent}% faster with server-side in-memory caching!\n`);

  } catch (err) {
    console.error("Benchmark error:", err);
  } finally {
    server.close();
  }
}

runBenchmark();
