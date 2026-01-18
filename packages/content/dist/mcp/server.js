#!/usr/bin/env node
// MCP Server entry point for klabo.world content management
// Run with: node packages/content/dist/mcp/server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { toolDefinitions, handleTool } from './index.js';
const server = new Server({
    name: 'klaboworld-content',
    version: '0.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleTool(name, args || {});
    return result;
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('klabo.world MCP server running on stdio');
}
main().catch((error) => {
    console.error('MCP server error:', error);
    process.exit(1);
});
