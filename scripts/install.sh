#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
HOOK_CMD="node $PROJECT_DIR/build/hook.js"

# Ensure build exists
if [ ! -f "$PROJECT_DIR/build/hook.js" ]; then
  echo "Error: build/hook.js not found. Run 'pnpm run build' first."
  exit 1
fi

# Create ~/.claude if needed
mkdir -p "$CLAUDE_DIR/skills"

# Install slash commands
cp -r "$PROJECT_DIR/.claude/skills/slack-on" "$CLAUDE_DIR/skills/"
cp -r "$PROJECT_DIR/.claude/skills/slack-off" "$CLAUDE_DIR/skills/"
cp -r "$PROJECT_DIR/.claude/skills/slack-status" "$CLAUDE_DIR/skills/"
cp -r "$PROJECT_DIR/.claude/skills/slack-message" "$CLAUDE_DIR/skills/"
echo "Installed slash commands: /slack-on, /slack-off, /slack-status, /slack-message"

# Optionally install the pre-approval hook
if [[ "${1:-}" == "--with-hook" ]]; then
  if [ ! -f "$SETTINGS_FILE" ]; then
    echo '{}' > "$SETTINGS_FILE"
  fi

  # Use node to merge the hook config (safer than jq for nested JSON)
  node -e "
  const fs = require('fs');
  const settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf-8'));

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

  // Remove any existing cc-slack hooks
  settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
    h => !JSON.stringify(h).includes('cc-slack')
  );

  settings.hooks.PreToolUse.push({
    matcher: 'Bash|Edit|Write|NotebookEdit',
    hooks: [{
      type: 'command',
      command: '$HOOK_CMD',
      timeout: 300000
    }]
  });

  fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2) + '\n');
  "
  echo "Installed hook into $SETTINGS_FILE"
fi

echo ""
echo "Done! Make sure CC_SLACK_BOT_TOKEN and CC_SLACK_USER_ID are set in your shell."
echo "Skills installed: /slack-on, /slack-off, /slack-status, /slack-message"
if [[ "${1:-}" != "--with-hook" ]]; then
  echo "To also install the pre-approval hook, re-run with: pnpm run install -- --with-hook"
fi
