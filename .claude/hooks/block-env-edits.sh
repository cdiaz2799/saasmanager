#!/usr/bin/env bash
# PreToolUse guard: block Write/Edit on .env files to prevent secret leakage.
file=$(jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ "$file" =~ (^|/)\.env(\.[^/]*)?$ ]]; then
  jq -n --arg reason "Editing $file is blocked to prevent leaking secrets. Edit .env files manually instead." \
    '{"decision": "block", "reason": $reason}'
fi
