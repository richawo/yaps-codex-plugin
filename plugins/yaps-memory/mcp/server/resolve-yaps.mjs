import {
  connectorCandidates,
  resolveYapsConnector,
} from "../../scripts/yaps-cli-discovery.mjs";

export function candidatePaths(options = {}) {
  return connectorCandidates(options).map(({ path }) => path);
}

export function resolveYapsMcpBinary(options = {}) {
  return resolveYapsConnector(options).path || undefined;
}
