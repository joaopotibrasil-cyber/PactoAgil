// Hostinger-friendly Next.js bootstrap.
// Ensures the server binds to 0.0.0.0:$PORT (common requirement on shared hosting/PaaS).

const { spawn } = require("node:child_process");

const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";

// Use `node node_modules/next/dist/bin/next start` to avoid relying on shell PATH.
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "start", "-p", port, "-H", host], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

