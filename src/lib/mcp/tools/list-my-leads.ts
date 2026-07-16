import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API_BASE = "https://leadora-saas-production.up.railway.app";

export default defineTool({
  name: "list_my_leads",
  title: "List my saved leads",
  description:
    "List the signed-in Leadora user's saved leads (business name, category, city, phone, email, website, rating, maps URL).",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Maximum number of leads to return (default: all)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const res = await fetch(`${API_BASE}/user/${userId}/leads`);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Failed to load leads (HTTP ${res.status})` }],
        isError: true,
      };
    }
    const data = (await res.json()) as { leads?: unknown[] } | unknown[];
    const raw = Array.isArray(data) ? data : Array.isArray(data?.leads) ? data.leads : [];
    const leads = typeof limit === "number" ? raw.slice(0, limit) : raw;
    return {
      content: [{ type: "text", text: `Found ${leads.length} saved lead(s).` }],
      structuredContent: { count: leads.length, leads },
    };
  },
});