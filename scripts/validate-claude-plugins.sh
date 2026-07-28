#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "${script_dir}/.." && pwd)"
plugins_dir="${repository_root}/plugins"

if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code is required to validate Claude plugins." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to test the Yaps Memory MCP resolver." >&2
  exit 1
fi

claude plugin validate "${repository_root}"

for plugin_dir in "${plugins_dir}"/yaps-*; do
  claude plugin validate "${plugin_dir}"
done

node --test "${plugins_dir}/yaps-memory/tests/resolve-yaps.test.mjs"

echo "Validated 11 Yaps plugins for Claude Code."
