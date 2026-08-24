import "dotenv/config";
import { env } from "node:process";
import cors from "cors";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const app = express();
const port = Number(env.API_PORT || 3001);
const mcpUrl = env.MCP_URL || "http://localhost:3002/mcp";
const gemini = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "1mb" }));

async function connectMcp() {
  const client = new Client({ name: "orbit-backend", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  await client.connect(transport);
  return { client, transport };
}

function textFromToolResult(result) {
  return (result.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n") || JSON.stringify(result);
}

app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is missing in .env" });
  if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "message is required" });

  let mcp;
  try {
    mcp = await connectMcp();
    const { tools } = await mcp.client.listTools();
    const functionDeclarations = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.inputSchema,
    }));
    const contents = [
      ...history.filter((item) => ["user", "assistant"].includes(item.role)).map(({ role, content }) => ({
        role: role === "assistant" ? "model" : "user",
        parts: [{ text: content }],
      })),
      { role: "user", parts: [{ text: message.trim() }] },
    ];

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await gemini.models.generateContent({
        model: env.GEMINI_MODEL || "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction: "You are Orbit, a concise and helpful assistant. Use the provided tools for current time and arithmetic instead of guessing or calculating yourself.",
          tools: [{ functionDeclarations }],
        },
      });
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const functionCalls = response.functionCalls || [];
      if (!functionCalls.length) return res.json({ reply: response.text || "I could not generate a response." });
      contents.push({ role: "model", parts });

      for (const toolCall of functionCalls) {
        const result = await mcp.client.callTool({ name: toolCall.name, arguments: toolCall.args || {} });
        contents.push({ role: "user", parts: [{ functionResponse: { name: toolCall.name, response: { result: textFromToolResult(result) } } }] });
      }
    }
    return res.status(502).json({ error: "The assistant made too many tool calls." });
  } catch (error) {
    console.error("Chat request failed:", error);
    return res.status(502).json({ error: "Unable to reach the LLM or MCP server. Check that both services are running." });
  } finally {
    if (mcp) await mcp.transport.close().catch(() => {});
  }
});

app.listen(port, () => console.log(`API server listening at http://localhost:${port}`));
