import { WebClient } from "@slack/web-api";

import type { ReactionDecision } from "./types.js";

const POLL_INTERVAL_MS = 5_000;

const client = new WebClient(process.env.CC_SLACK_BOT_TOKEN);
const userId = process.env.CC_SLACK_USER_ID!;

let cachedDmChannel: string | undefined;

export async function getDmChannel(): Promise<string> {
  if (cachedDmChannel) return cachedDmChannel;
  const res = await client.conversations.open({ users: userId });
  cachedDmChannel = res.channel!.id!;
  return cachedDmChannel;
}

export async function sendApprovalRequest(
  description: string,
): Promise<{ channel: string; ts: string }> {
  const channel = await getDmChannel();
  const res = await client.chat.postMessage({
    channel,
    text: description,
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
            text: ":white_check_mark: approve · :unlock: allow all of this tool · :x: deny",
          },
        ],
      },
    ],
  });
  return { channel, ts: res.ts! };
}

export async function checkReactions(
  channel: string,
  messageTs: string,
): Promise<ReactionDecision> {
  const res = await client.reactions.get({ channel, timestamp: messageTs });
  const reactions = res.message?.reactions ?? [];

  const hasReaction = (name: string): boolean =>
    reactions.some((r) => r.name === name && r.users?.includes(userId));

  if (hasReaction("unlock")) return "allow_all";
  if (hasReaction("white_check_mark")) return "approved";
  if (hasReaction("x")) return "denied";
  return "pending";
}

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
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, POLL_INTERVAL_MS);
      if (signal) {
        signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
      }
    });
  }
  return "pending";
}

export async function sendMessage(
  text: string,
  expectReply = true,
): Promise<{ channel: string; ts: string }> {
  const channel = await getDmChannel();
  const blocks = expectReply
    ? [
        { type: "section" as const, text: { type: "mrkdwn" as const, text } },
        {
          type: "context" as const,
          elements: [
            { type: "mrkdwn" as const, text: "_Reply in a thread to respond_" },
          ],
        },
      ]
    : [
        { type: "section" as const, text: { type: "mrkdwn" as const, text } },
      ];
  const res = await client.chat.postMessage({ channel, text, blocks });
  return { channel, ts: res.ts! };
}

export async function waitForThreadReply(
  channel: string,
  messageTs: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (signal?.aborted) return null;
    const res = await client.conversations.replies({
      channel,
      ts: messageTs,
      limit: 10,
    });
    const reply = res.messages?.find(
      (m) => m.ts !== messageTs && m.user === userId,
    );
    if (reply?.text) return reply.text;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, POLL_INTERVAL_MS);
      if (signal) {
        signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
      }
    });
  }
  return null;
}
