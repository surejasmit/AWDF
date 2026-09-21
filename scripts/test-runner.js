/**
 * Root Test Runner Script
 * Forwards execution to backend automated test suite
 */
const { spawn } = require("child_process");
const path = require("path");

console.log(" Running full AWDF backend integration test suite...\n");

const backendDir = path.resolve(__dirname, "..", "backend");
const testProcess = spawn("node", ["tests/test-runner.js"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: true,
});

testProcess.on("close", (code) => {
  process.exit(code);
});
