#!/usr/bin/env node

import * as crypto from "node:crypto";
import * as fs from "node:fs";

import { sendApprovalRequest, waitForDecision } from "./slack.js";
import type { HookInput, HookOutput, ReactionDecision } from "./types.js";

const TIMEOUT_MS = 5 * 60 * 1000;

const DECISION_TO_PERMISSION: Record<ReactionDecision, "allow" | "deny" | "ask"> = {
  approved: "allow",
  allow_all: "allow",
  denied: "deny",
  pending: "ask",
};

function flagFile(): string {
  const hash = crypto.createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12);
  return `/tmp/cc-slack-enabled-${hash}`;
}

function makeOutput(decision: "allow" | "deny" | "ask"): HookOutput {
  return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision } };
}

function isEnabled(): boolean {
  return fs.existsSync(flagFile());
}

function allowAllFile(sessionId: string, toolName: string): string {
  return `/tmp/cc-slack-allowall-${sessionId}-${toolName}`;
}

function isToolAllowedAll(sessionId: string, toolName: string): boolean {
  return fs.existsSync(allowAllFile(sessionId, toolName));
}

function markToolAllowedAll(sessionId: string, toolName: string): void {
  fs.writeFileSync(allowAllFile(sessionId, toolName), "");
}

function formatDescription(input: HookInput): string {
  const { tool_name, tool_input } = input;
  switch (tool_name) {
    case "Bash": {
      const cmd = (tool_input.command as string) ?? "(no command)";
      return `*Bash*: Run:\n\`\`\`\n${cmd}\n\`\`\``;
    }
    case "Edit":
    case "Write": {
      const file = (tool_input.file_path as string) ?? "(unknown file)";
      return `*${tool_name}*: \`${file}\``;
    }
    case "NotebookEdit": {
      const file = (tool_input.notebook_path as string) ?? "(unknown notebook)";
      return `*NotebookEdit*: \`${file}\``;
    }
    default:
      return `*${tool_name}*: \`\`\`${JSON.stringify(tool_input, null, 2)}\`\`\``;
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function main(): Promise<void> {
  const raw = await readStdin();

  if (!isEnabled() || !process.env.CC_SLACK_BOT_TOKEN || !process.env.CC_SLACK_USER_ID) {
    process.stdout.write(JSON.stringify(makeOutput("ask")));
    return;
  }

  const input: HookInput = JSON.parse(raw);

  // Respect Claude Code's permission mode
  if (input.permission_mode === "bypassPermissions") {
    process.stdout.write(JSON.stringify(makeOutput("allow")));
    return;
  }

  // Skip if user already allowed-all this tool type in this session
  if (isToolAllowedAll(input.session_id, input.tool_name)) {
    process.stdout.write(JSON.stringify(makeOutput("allow")));
    return;
  }

  const description = formatDescription(input);
  const { channel, ts } = await sendApprovalRequest(description);
  const decision = await waitForDecision(channel, ts, TIMEOUT_MS);

  if (decision === "allow_all") {
    markToolAllowedAll(input.session_id, input.tool_name);
  }

  process.stdout.write(JSON.stringify(makeOutput(DECISION_TO_PERMISSION[decision])));
}

main().catch(() => {
  process.stdout.write(JSON.stringify(makeOutput("ask")));
  process.exit(0);
});
