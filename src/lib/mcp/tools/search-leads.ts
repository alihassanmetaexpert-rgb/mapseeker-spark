import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API_BASE = "https://leadora-saas-production.up.railway.app";

export default defineTool({
  name: "search_leads",
  title: "Search Google Maps leads",
  description:
    "Start a Leadora scrape for a business type in a city. Returns a job_id you can poll with get_job_status. Saved to the signed-in user's account.",
  inputSchema: {
    business_type: z.string().min(1).describe('e.g. "dental clinic", "marketing agency"'),
    city: z.string().min(1).describe('e.g. "New York, NY"'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(400)
      .default(50)
      .describe("How many leads to fetch (1-400)."),
    find_emails: z.boolean().default(true).describe("Enrich results with email lookup."),
  },
  annotations: { readOnlyHint: false, openWorldHint: true },
  handler: async ({ business_type, city, limit, find_emails }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const res = await fetch(`${API_BASE}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: business_type,
        business_type,
        city,
        limit,
        max_results: limit,
        find_emails,
        user_id: ctx.getUserId(),
      }),
    });
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Failed to start scrape (HTTP ${res.status})` }],
        isError: true,
      };
    }
    const data = (await res.json()) as { job_id?: string };
    if (!data.job_id) {
      return { content: [{ type: "text", text: "Scrape started but no job_id returned." }], isError: true };
    }
    return {
      content: [
        {
          type: "text",
          text: `Scrape started. job_id=${data.job_id}. Use get_job_status to poll.`,
        },
      ],
      structuredContent: { job_id: data.job_id },
    };
  },
});