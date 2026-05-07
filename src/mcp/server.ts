#!/usr/bin/env node

/**
 * cc-dash MCP Server — entry point
 *
 * Register at user scope so the tools are reachable from any cwd
 * (e.g. ~/projects where the orchestrator agent runs):
 *
 *   claude mcp add --scope user cc-dash -- \
 *     npx tsx \
 *     --tsconfig /absolute/path/to/prd-board/tsconfig.json \
 *     /absolute/path/to/prd-board/src/mcp/server.ts
 *
 * The `--tsconfig` flag is required: tsx walks up from cwd looking for
 * tsconfig.json, and without it the `@/` path alias fails to resolve
 * when claude is invoked from outside the prd-board directory.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "@/mcp/create-server";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
