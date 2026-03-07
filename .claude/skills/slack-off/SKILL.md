---
name: slack-off
description: Disable Slack approval mode — use normal terminal prompts
allowed-tools: Bash(rm:*)
---

Run this command:

```bash
rm -f "/tmp/cc-slack-enabled-$(echo -n "$(pwd)" | shasum -a 256 | cut -c1-12)"
```

Then tell the user: Slack approval mode is OFF for this project.
