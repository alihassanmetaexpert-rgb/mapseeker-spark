import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API_BASE = "https://leadora-saas-production.up.railway.app";

export default defineTool({
  name: "get_job_status",
  title: "Get scrape job status",
  description:
    "Check the status and current results of a Leadora scrape job started by search_leads.",
  inputSchema: {
    job_id: z.string().min(1).describe("The job_id returned by search_leads."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ job_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const res = await fetch(`${API_BASE}/job/${job_id}`);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Failed to load job (HTTP ${res.status})` }],
        isError: true,
      };
    }
    const data = (await res.json()) as {
      status?: string;
      leads?: unknown[];
      logs?: unknown[];
    };
    const count = Array.isArray(data.leads) ? data.leads.length : 0;
    return {
      content: [
        {
          type: "text",
          text: `Status: ${data.status ?? "unknown"} — ${count} lead(s) so far.`,
        },
      ],
      structuredContent: data,
    };
  },
});