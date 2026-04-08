#!/usr/bin/env node

/**
 * cc-dash MCP Server — entry point
 *
 * Usage:
 *   claude mcp add cc-dash -- npx tsx src/mcp/server.ts
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
