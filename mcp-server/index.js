import "dotenv/config";
import { env } from "node:process";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
const port = Number(env.MCP_PORT || 3002);

app.use(express.json());

function createMcpServer() {
  const server = new McpServer({ name: "orbit-tools", version: "1.0.0" });

  server.registerTool(
    "get_current_time",
    {
      title: "Get current time",
      description: "Get the current date and time for an IANA timezone such as Asia/Kolkata.",
      inputSchema: { timezone: z.string().default("UTC").describe("IANA timezone name") },
    },
    async ({ timezone }) => {
      try {
        const formatted = new Intl.DateTimeFormat("en-IN", {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: timezone,
        }).format(new Date());
        return { content: [{ type: "text", text: `${formatted} (${timezone})` }] };
      } catch {
        return { isError: true, content: [{ type: "text", text: `Unknown timezone: ${timezone}` }] };
      }
    },
  );

  server.registerTool(
    "calculate",
    {
      title: "Calculate",
      description: "Evaluate a basic arithmetic expression using numbers, decimals, parentheses, and + - * / operators.",
      inputSchema: { expression: z.string().describe("Arithmetic expression") },
    },
    async ({ expression }) => {
      if (!/^[0-9+*/().%\s-]+$/.test(expression)) {
        return { isError: true, content: [{ type: "text", text: "Only basic arithmetic expressions are allowed." }] };
      }
      try {
        const result = Function(`"use strict"; return (${expression})`)();
        if (typeof result !== "number" || !Number.isFinite(result)) throw new Error("Invalid result");
        return { content: [{ type: "text", text: String(result) }] };
      } catch {
        return { isError: true, content: [{ type: "text", text: "That expression could not be calculated." }] };
      }
    },
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "MCP server error" });
  }
});

app.get("/mcp", (_req, res) => res.status(405).json({ error: "Use POST for MCP requests." }));
app.delete("/mcp", (_req, res) => res.status(405).json({ error: "Stateless MCP sessions cannot be deleted." }));

app.listen(port, () => console.log(`MCP server listening at http://localhost:${port}/mcp`));
