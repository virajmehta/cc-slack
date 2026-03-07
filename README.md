# cc-slack

Approve Claude Code tool calls from your phone via Slack. When Claude Code wants to run Bash, Edit, Write, or NotebookEdit, you get a Slack DM. React with :white_check_mark: to approve or :x: to deny. If you don't respond within 5 minutes, it falls back to the normal terminal prompt.

Slack mode is off by default — use `/slack-on` in any Claude Code session to enable it before you walk away, and `/slack-off` when you're back.

## Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Give it a name (e.g. "Claude Code") and select your workspace

### 2. Configure Bot Scopes

1. In the left sidebar, go to **OAuth & Permissions**
2. Scroll down to **Scopes** → **Bot Token Scopes**
3. Add these four scopes:
   - `chat:write` — send DMs
   - `reactions:read` — read your emoji reactions
   - `im:write` — open DM conversations
   - `im:history` — read DM history (required for reactions)

### 3. Install to Workspace

1. Scroll to the top of **OAuth & Permissions**
2. Click **Install to Workspace** and approve
3. Copy the **Bot User OAuth Token** — it starts with `xoxb-`

> **Note:** The Client ID, Client Secret, and Signing Secret on the Basic Information page are _not_ what you need. You need the **Bot User OAuth Token** from the OAuth & Permissions page.

### 4. Get Your Slack Member ID

1. Open Slack
2. Click your profile picture → **Profile**
3. Click the **...** (three dots) menu
4. Click **Copy member ID** (looks like `U067A0LQ57Y`)

### 5. Clone and Build

```bash
git clone <repo-url> cc-slack
cd cc-slack
pnpm install
pnpm run build
```

### 6. Set Environment Variables

Add to your `~/.zshrc` (or `~/.bashrc`):

```bash
export CC_SLACK_BOT_TOKEN=xoxb-your-token-here
export CC_SLACK_USER_ID=U0YOUR_ID
```

Or use [direnv](https://direnv.net/).

### 7. Install Globally

This installs the hook into `~/.claude/settings.json` and copies the slash commands to `~/.claude/skills/`:

```bash
pnpm run install-hook
```

That's it. The hook is now active in every Claude Code project.

## Usage

From any Claude Code session:

- `/slack-on` — enable Slack approvals for this project
- `/slack-off` — disable, back to normal terminal prompts
- `/slack-status` — check current mode

The toggle is per-project, so enabling it in one project doesn't affect others.

## How It Works

```
/slack-on
  → creates a flag file for this project

Claude Code wants to run a tool
  → PreToolUse hook fires
    → flag file exists? send Slack DM, poll for reaction
    → no flag file? return "ask", native terminal prompt
```

When Slack mode is on:
- :white_check_mark: reaction → tool runs
- :x: reaction → tool is blocked
- No reaction within 5 min → falls back to terminal prompt

## Testing

```bash
pnpm run test:e2e
```

Sends a test approval request to your Slack DM. React and verify the result.

## Troubleshooting

**No Slack DM received:**
- Verify env vars are set: `echo $CC_SLACK_BOT_TOKEN`
- Make sure the bot has all 4 scopes and is installed to your workspace

**Hook returns `"ask"` every time:**
- Check Slack mode is on: `/slack-status`
- Run the hook directly to see errors: `echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | node build/hook.js`

**`build/hook.js` not found:**
- Run `pnpm run build`
