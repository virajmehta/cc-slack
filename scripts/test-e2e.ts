#!/usr/bin/env tsx

/**
 * Manual E2E test: sends a fake Bash hook input through the hook
 * and waits for a Slack reaction.
 *
 * Usage: SLACK_BOT_TOKEN=xoxb-... SLACK_USER_ID=U... npx tsx scripts/test-e2e.ts
 */

import { spawn } from "node:child_process";
import path from "node:path";

const hookPath = path.resolve(
  new URL(".", import.meta.url).pathname,
  "../build/hook.js",
);

const input = JSON.stringify({
  tool_name: "Bash",
  tool_input: { command: "echo 'hello from cc-slack test'" },
});

console.log("Spawning hook with test input...");
const child = spawn("node", [hookPath], {
  stdio: ["pipe", "pipe", "inherit"],
  env: { ...process.env },
});

child.stdin.write(input);
child.stdin.end();

let output = "";
child.stdout.on("data", (chunk: Buffer) => {
  output += chunk.toString();
});

child.on("close", (code) => {
  console.log(`Hook exited with code ${code}`);
  console.log("Output:", output);
  try {
    const parsed = JSON.parse(output);
    console.log("Parsed:", JSON.stringify(parsed, null, 2));
  } catch {
    console.error("Failed to parse output as JSON");
  }
});
