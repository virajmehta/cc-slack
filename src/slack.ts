import { WebClient } from "@slack/web-api";

import type { ReactionDecision } from "./types.js";

const POLL_INTERVAL_MS = 5_000;

const client = new WebClient(process.env.CC_SLACK_BOT_TOKEN);
const userId = process.env.CC_SLACK_USER_ID!;

let cachedDmChannel: string | undefined;

/** Open (or return cached) DM channel with the configured user. */
export async function getDmChannel(): Promise<string> {
  if (cachedDmChannel) return cachedDmChannel;
  const res = await client.conversations.open({ users: userId });
  cachedDmChannel = res.channel!.id!;
  return cachedDmChannel;
}

/** Send a Block Kit approval request and return channel + ts for polling. */
export async function sendApprovalRequest(
  description: string,
): Promise<{ channel: string; ts: string }> {
  const channel = await getDmChannel();
  const res = await client.chat.postMessage({
    channel,
    text: description, // fallback for notifications
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: description },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "React :white_check_mark: to approve or :x: to deny",
          },
        ],
      },
    ],
  });
  return { channel, ts: res.ts! };
}

/** Check reactions on a message and return the decision. */
export async function checkReactions(
  channel: string,
  messageTs: string,
): Promise<ReactionDecision> {
  const res = await client.reactions.get({ channel, timestamp: messageTs });
  const reactions = res.message?.reactions ?? [];
  for (const r of reactions) {
    if (
      r.name === "white_check_mark" &&
      r.users?.includes(userId)
    ) {
      return "approved";
    }
    if (r.name === "x" && r.users?.includes(userId)) {
      return "denied";
    }
  }
  return "pending";
}

/** Poll reactions until approved/denied, timeout, or abort. */
export async function waitForDecision(
  channel: string,
  messageTs: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<ReactionDecision> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (signal?.aborted) return "pending";
    const decision = await checkReactions(channel, messageTs);
    if (decision !== "pending") return decision;
    await new Promise<void>((r) => {
      const timer = setTimeout(r, POLL_INTERVAL_MS);
      if (signal) {
        signal.addEventListener("abort", () => { clearTimeout(timer); r(); }, { once: true });
      }
    });
  }
  return "pending"; // timed out
}
