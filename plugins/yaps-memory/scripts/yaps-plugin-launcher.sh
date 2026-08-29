#!/bin/sh

# Start the privacy-safe Yaps plugin runner without assuming Node is installed
# system-wide. Codex Desktop bundles a private Node runtime even on a clean Mac,
# but that runtime is not added to local-task PATH.

set -u

case "$0" in
  */*) launcher_dir=${0%/*} ;;
  *) launcher_dir=. ;;
esac

if ! launcher_dir=$(CDPATH= cd -- "$launcher_dir" 2>/dev/null && pwd -P); then
  printf '%s\n' 'Yaps could not resolve its local connector files.' >&2
  exit 127
fi

runner_path="$launcher_dir/yaps-plugin-runner.mjs"
if [ ! -f "$runner_path" ]; then
  printf '%s\n' 'Yaps could not find its local connector runner. Reinstall the Yaps plugin and try again.' >&2
  exit 127
fi

node_binary=

for node_candidate in \
  "${YAPS_PLUGIN_NODE_BINARY:-}" \
  "${CODEX_MCP_NODE_PATH:-}"
do
  if [ -n "$node_candidate" ] && [ -x "$node_candidate" ]; then
    node_binary=$node_candidate
    break
  fi
done

if [ -z "$node_binary" ] && command -v node >/dev/null 2>&1; then
  node_binary=$(command -v node)
fi

if [ -z "$node_binary" ] && [ -n "${CODEX_ELECTRON_RESOURCES_PATH:-}" ]; then
  node_candidate="${CODEX_ELECTRON_RESOURCES_PATH}/cua_node/bin/node"
  if [ -x "$node_candidate" ]; then
    node_binary=$node_candidate
  fi
fi

if [ -z "$node_binary" ] && [ -n "${CODEX_CLI_PATH:-}" ]; then
  node_candidate="${CODEX_CLI_PATH%/*}/cua_node/bin/node"
  if [ -x "$node_candidate" ]; then
    node_binary=$node_candidate
  fi
fi

if [ -z "$node_binary" ]; then
  for node_candidate in \
    '/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node' \
    '/Applications/Codex.app/Contents/Resources/cua_node/bin/node' \
    "${HOME:-}/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node" \
    "${HOME:-}/Applications/Codex.app/Contents/Resources/cua_node/bin/node"
  do
    if [ -x "$node_candidate" ]; then
      node_binary=$node_candidate
      break
    fi
  done
fi

if [ -z "$node_binary" ]; then
  printf '%s\n' 'Yaps could not start its local connector with this Codex installation. Update Codex and reinstall the Yaps plugin, then try again.' >&2
  exit 127
fi

exec "$node_binary" "$runner_path" "$@"
