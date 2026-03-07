---
name: slack-status
description: Check if Slack approval mode is on or off
allowed-tools: Bash(test:*), Bash([:*)
---

Run this command:

```bash
[ -f "/tmp/cc-slack-enabled-$(echo -n "$(pwd)" | shasum -a 256 | cut -c1-12)" ] && echo "ON" || echo "OFF"
```

Then tell the user whether Slack approval mode is currently on or off for this project.
