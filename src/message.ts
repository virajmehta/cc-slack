#!/usr/bin/env node

import { sendMessage, waitForThreadReply } from "./slack.js";

function parseTimeout(value: string): number {
  const match = value.match(/^(\d+)(s|m|h)?$/);
  if (!match) {
    throw new Error(`Invalid timeout: ${value}`);
  }
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "h": return num * 60 * 60 * 1000;
    case "s": return num * 1000;
    case "m":
    default:  return num * 60 * 1000;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let noWait = false;
  let timeoutMs = 10 * 60 * 1000; // 10 minutes
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--no-wait") {
      noWait = true;
    } else if (args[i] === "--timeout" && i + 1 < args.length) {
      timeoutMs = parseTimeout(args[++i]);
    } else if (!args[i].startsWith("--")) {
      positional.push(args[i]);
    }
  }

  const text = positional.join(" ");
  if (!text) {
    console.error("Usage: message.js [--no-wait] [--timeout 10m] \"message\"");
    process.exit(1);
  }

  const { channel, ts } = await sendMessage(text, !noWait);

  if (noWait) {
    process.stdout.write(JSON.stringify({ sent: true }) + "\n");
    return;
  }

  const reply = await waitForThreadReply(channel, ts, timeoutMs);
  if (reply !== null) {
    process.stdout.write(JSON.stringify({ reply }) + "\n");
  } else {
    process.stdout.write(JSON.stringify({ reply: null, timeout: true }) + "\n");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
