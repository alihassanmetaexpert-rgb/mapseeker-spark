import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchLeads from "./tools/search-leads";
import listMyLeads from "./tools/list-my-leads";
import getJobStatus from "./tools/get-job-status";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "leadora-mcp",
  title: "Leadora",
  version: "0.1.0",
  instructions:
    "Leadora finds business leads on Google Maps. Use search_leads to start a scrape, get_job_status to poll it, and list_my_leads to read the signed-in user's saved leads.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchLeads, getJobStatus, listMyLeads],
});