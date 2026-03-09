---
name: slack-message
description: Send a message to the user via Slack DM and wait for their reply
allowed-tools: Bash(node:*)
---

Send a message to the user on Slack and optionally wait for their threaded reply.

Run:

```bash
node /Users/viraj/src/cc-slack/build/message.js "Your message here"
```

Parse the JSON output to get the reply:
- `{"reply":"user's text"}` — the user replied
- `{"reply":null,"timeout":true}` — timed out waiting (default 10 min)

Options:
- `--no-wait` — fire-and-forget; don't wait for a reply. Output: `{"sent":true}`
- `--timeout 5m` — custom timeout (e.g. `30s`, `5m`, `1h`)

Examples:

Ask the user a question and wait for their answer:
```bash
node /Users/viraj/src/cc-slack/build/message.js "Which database should I use for this feature?"
```

Send a notification (no reply needed):
```bash
node /Users/viraj/src/cc-slack/build/message.js --no-wait "Build completed successfully"
```

Wait longer for a reply:
```bash
node /Users/viraj/src/cc-slack/build/message.js --timeout 30m "I've drafted the PR — please review when you get a chance and reply here with feedback"
```
