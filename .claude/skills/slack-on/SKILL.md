---
name: slack-on
description: Enable Slack approval mode — tool calls route through Slack DMs
allowed-tools: Bash(touch:*)
---

Run this command:

```bash
touch "/tmp/cc-slack-enabled-$(echo -n "$(pwd)" | shasum -a 256 | cut -c1-12)"
```

Then tell the user: Slack approval mode is ON for this project.
