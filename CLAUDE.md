# cc-slack

Slack approval hook for Claude Code. Routes `PreToolUse` permission checks through Slack DMs.

## Build

```
pnpm install && pnpm run build
```

## Install globally

```
pnpm run install
```

## Required env vars

- `CC_SLACK_BOT_TOKEN` — Bot token with scopes: `chat:write`, `reactions:read`, `im:write`, `im:history`
- `CC_SLACK_USER_ID` — Your Slack member ID (find in profile → three dots → "Copy member ID")

## Usage

Slack mode is off by default. Toggle with slash commands:

- `/slack-on` — enable Slack approvals for this project
- `/slack-off` — disable, back to normal terminal prompts
- `/slack-status` — check current mode

## Test

```
CC_SLACK_BOT_TOKEN=xoxb-... CC_SLACK_USER_ID=U... pnpm run test:e2e
```

## Messaging

`/slack-message` lets Claude send you a Slack DM and wait for your threaded reply. Works independently of `/slack-on` — no need to enable approval mode.

```
node build/message.js "Your message"              # send + wait for reply (10 min)
node build/message.js --no-wait "Notification"     # fire-and-forget
node build/message.js --timeout 30m "Review this"  # custom timeout
```

Output is JSON on stdout: `{"reply":"..."}`, `{"reply":null,"timeout":true}`, or `{"sent":true}`.

## How it works

The hook runs `build/hook.js` on every Bash, Edit, Write, or NotebookEdit tool use. When Slack mode is on (via `/slack-on`), it sends a Slack DM and polls for a reaction (:white_check_mark: to approve, :x: to deny). When Slack mode is off, it returns `"ask"` so Claude Code shows the normal terminal prompt. On timeout (5 min) or error, it also falls back to the terminal prompt.
