#!/usr/bin/env bash
# PostToolUse check: type-check the workspace package a Write/Edit touched.
file=$(jq -r '.tool_input.file_path // .tool_input.path // empty')

[[ "$file" == *.ts || "$file" == *.tsx ]] || exit 0
[[ "$file" == */apps/*/src/* || "$file" == */packages/*/src/* ]] || exit 0

pkg_dir=$(echo "$file" | grep -oE '^.*/(apps|packages)/[^/]+')
[[ -f "$pkg_dir/package.json" ]] || exit 0

pkg_name=$(node -pe "require('$pkg_dir/package.json').name" 2>/dev/null)
[[ -n "$pkg_name" ]] || exit 0

repo_root=$(echo "$pkg_dir" | sed -E 's#/(apps|packages)/[^/]+$##')
cd "$repo_root" || exit 0

bun x turbo run check-types -F "...${pkg_name}" 2>&1 | tail -n 40
