import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LeadoraLogo } from "@/components/LeadoraLogo";
import {
  LayoutDashboard,
  Users,
  Sheet as SheetIcon,
  Settings as SettingsIcon,
  MapPin,
  Search,
  Mail,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Globe,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Leadora" },
      { name: "description", content: "Manage your leads and export them to Excel or Google Sheets from your Leadora dashboard." },
      { property: "og:title", content: "Dashboard — Leadora" },
      { property: "og:description", content: "Manage your leads and export them to Excel or Google Sheets from your Leadora dashboard." },
      { property: "og:url", content: "https://mapseeker-spark.lovable.app/dashboard" },
    ],
    links: [
      { rel: "canonical", href: "https://mapseeker-spark.lovable.app/dashboard" },
    ],
  }),
  component: Dashboard,
});

const API_BASE = "https://leadora-saas-production.up.railway.app";

function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("leadora_user_id");
  if (!id || id === "undefined" || id === "null") {
    id = (crypto.randomUUID?.() ?? `u_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem("leadora_user_id", id);
  }
  return id;
}

type Lead = {
  id: number;
  name: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  rating: number | string;
  mapsUrl: string;
};

type Section = "dashboard" | "leads" | "sheets" | "settings";

function Dashboard() {
  const [section, setSection] = useState<Section>("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetVerified, setSheetVerified] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center px-4 py-5">
          <LeadoraLogo variant="dark" className="h-12 w-auto" />
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {[
            { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { id: "leads", label: "My Leads", Icon: Users },
            { id: "sheets", label: "Google Sheets", Icon: SheetIcon },
            { id: "settings", label: "Settings", Icon: SettingsIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as Section)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                section === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
          v1.0
        </div>
      </aside>

      {/* Mobile top tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2">
        {(["dashboard", "leads", "sheets", "settings"] as Section[]).map((id) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs capitalize",
              section === id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            {id}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 pb-10 pt-16 md:px-8 md:pt-8">
        {section === "dashboard" && (
          <DashboardSection
            leads={leads}
            setLeads={setLeads}
            googleConnected={googleConnected}
            sheetUrl={sheetUrl}
            sheetVerified={sheetVerified}
          />
        )}
        {section === "leads" && <LeadsSection leads={leads} />}
        {section === "sheets" && (
          <SheetsSection
            sheetUrl={sheetUrl}
            setSheetUrl={setSheetUrl}
            googleConnected={googleConnected}
            setGoogleConnected={setGoogleConnected}
            sheetVerified={sheetVerified}
            setSheetVerified={setSheetVerified}
          />
        )}
        {section === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}

/* -------------------- Dashboard / Generate -------------------- */
const NICHE_TAGS: string[] = [
  "Marketing Agency", "Dental Clinic", "Real Estate Agent", "Law Firm",
  "Restaurant", "Gym & Fitness", "Plumber", "Electrician", "Accountant",
  "Hair Salon", "Auto Repair", "Mortgage Broker", "Insurance Agent",
  "Web Designer", "Photographer",
];

function DashboardSection({
  leads,
  setLeads,
  googleConnected,
  sheetUrl,
  sheetVerified,
}: {
  leads: Lead[];
  setLeads: (l: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  googleConnected: boolean;
  sheetUrl: string;
  sheetVerified: boolean;
}) {
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [count, setCount] = useState("50");
  const [findEmails, setFindEmails] = useState(true);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [lastJobId, setLastJobId] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  const pushLog = (line: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  const handleGenerate = async () => {
    if (!businessType || !city) {
      pushLog("ERROR: Business type and city are required.");
      return;
    }
    setRunning(true);
    setLogs([]);
    setLeads([]);
    setLastJobId("");
    setSyncMsg(null);
    const maxResults = count === "custom"
      ? Math.min(500, Math.max(1, Number(customCount) || 0))
      : Number(count);
    if (count === "custom" && (!maxResults || maxResults < 1)) {
      pushLog("ERROR: Enter a custom value between 1 and 500.");
      setRunning(false);
      return;
    }
    setStatus(`Submitting job: ${businessType} in ${city}...`);
    pushLog(`POST /scrape`);
    const userId = getUserId();
    pushLog(`Body: { query: "${businessType}", city: "${city}", limit: ${maxResults}, find_emails: true, user_id, sheet_url }`);

    try {
      const res = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: businessType,
          city,
          limit: maxResults,
          find_emails: true,
          user_id: userId,
          sheet_url: sheetUrl || "",
        }),
      });
      if (!res.ok) throw new Error(`POST /scrape failed: ${res.status} ${res.statusText}`);
      const submitJson = await res.json();
      const jobId = submitJson.job_id ?? submitJson.id ?? submitJson.jobId;
      if (!jobId) throw new Error(`No job_id in response: ${JSON.stringify(submitJson)}`);
      setLastJobId(String(jobId));
      pushLog(`✔ Job created: ${jobId}`);
      setStatus(`Job ${jobId} queued. Polling...`);

      let seenLeadCount = 0;
      let lastStatus = "";
      // Poll loop
      while (true) {
        await new Promise((r) => setTimeout(r, 3000));
        let pollRes: Response;
        try {
          pollRes = await fetch(`${API_BASE}/job/${jobId}`);
        } catch (e: any) {
          pushLog(`Poll error: ${e.message}. Retrying...`);
          continue;
        }
        if (!pollRes.ok) {
          pushLog(`GET /job/${jobId} → ${pollRes.status}. Retrying...`);
          continue;
        }
        const job = await pollRes.json();
        const jobStatus: string = job.status ?? "unknown";
        const results: any[] = job.results ?? job.leads ?? job.data ?? [];

        if (jobStatus !== lastStatus) {
          pushLog(`Status: ${jobStatus}`);
          lastStatus = jobStatus;
        }

        if (results.length > seenLeadCount) {
          const fresh = results.slice(seenLeadCount);
          setLeads((prev) => {
            const startId = prev.length;
            const mapped = fresh.map((r, i) => normalizeLead(r, startId + i + 1, businessType, city));
            return [...prev, ...mapped];
          });
          for (const r of fresh) {
            const name = r.name ?? r.business_name ?? r.title ?? "(no name)";
            pushLog(`✔ Found: ${name}`);
          }
          seenLeadCount = results.length;
        }

        setStatus(`${jobStatus} — ${results.length}/${maxResults} leads`);

        if (["completed", "complete", "done", "finished", "success"].includes(jobStatus.toLowerCase())) {
          pushLog(`✔ Completed. Total: ${results.length} leads.`);
          setStatus(`Done — ${results.length} leads`);
          // Auto-sync to Google Sheets if connected
          if (googleConnected && sheetVerified && sheetUrl && results.length) {
            try {
              pushLog(`Syncing ${results.length} leads to Google Sheets...`);
              const syncRes = await fetch(`${API_BASE}/sheets/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: getUserId(),
                  sheet_url: sheetUrl,
                  job_id: jobId,
                  sheet_name: "Leads",
                }),
              });
              if (!syncRes.ok) throw new Error(`${syncRes.status} ${syncRes.statusText}`);
              const sjson = await syncRes.json().catch(() => ({}));
              const synced = sjson.synced ?? sjson.count ?? results.length;
              pushLog(`✔ ${synced} leads synced to Google Sheets`);
            } catch (e: any) {
              pushLog(`✖ Sheet sync failed: ${e.message}`);
            }
          }
          break;
        }
        if (["failed", "error", "cancelled", "canceled"].includes(jobStatus.toLowerCase())) {
          pushLog(`✖ Job ended with status: ${jobStatus}`);
          setStatus(`Failed — ${jobStatus}`);
          break;
        }
      }
    } catch (err: any) {
      pushLog(`ERROR: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleManualSync = async () => {
    if (!lastJobId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API_BASE}/sheets/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: lastJobId,
          user_id: getUserId(),
          sheet_url: sheetUrl,
          sheet_name: "Leads",
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json().catch(() => ({} as any));
      const synced = json.synced ?? json.count ?? leads.length;
      setSyncMsg({ type: "ok", text: `✔ ${synced} leads synced to Google Sheets` });
    } catch (e: any) {
      setSyncMsg({ type: "err", text: `✖ Sync failed: ${e.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const exportExcel = () => {
    if (!leads.length) return;
    const headers = ["#", "Name", "Category", "City", "Phone", "Email", "Website", "Rating", "Maps"];
    const rows = leads.map((l) => [
      l.id, l.name, l.category, l.city, l.phone, l.email, l.website, l.rating, l.mapsUrl,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadhunter-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate Leads</h1>
        <p className="text-sm text-muted-foreground">
          Search Google Maps for any business type in any city.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bt">Business Type</Label>
            <Input id="bt" placeholder="e.g. dental clinic"
              value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {NICHE_TAGS.map((tag) => {
                const selected = businessType.trim().toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setBusinessType(tag)}
                    className={
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors " +
                      (selected
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200")
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="e.g. New York, NY"
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">Number of Leads</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger id="count" aria-label="Number of Leads"><SelectValue /></SelectTrigger>
              <SelectContent>
              {["20", "30", "50", "70", "100"].map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {count === "custom" && (
              <div className="space-y-1 pt-1">
                <Input
                  id="customCount"
                  type="number"
                  min={1}
                  max={500}
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  placeholder="Enter a number (1-500)"
                />
                <p className="text-xs text-muted-foreground">Max 500 leads per search.</p>
              </div>
            )}
          </div>
          <div className="flex items-end justify-between rounded-md border border-border bg-secondary/50 p-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <Label htmlFor="emails" className="cursor-pointer">Find Emails</Label>
            </div>
            <Switch id="emails" checked={findEmails} onCheckedChange={setFindEmails} />
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={running}
          className="mt-6 h-12 w-full bg-gradient-to-r from-primary to-[oklch(0.68_0.16_250)] text-primary-foreground text-base font-semibold shadow-[var(--shadow-elegant)] hover:opacity-95"
        >
          {running ? <><Loader2 className="animate-spin" /> Generating...</> : <><Search /> Generate Leads</>}
        </Button>
      </div>

      {/* Progress */}
      {(running || logs.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {running ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.18_150)]" />}
              <span className="font-medium">{status}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{leads.length}</span> leads found so far
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-to-r from-primary to-[oklch(0.68_0.16_250)] transition-all"
              style={{ width: `${Math.min(100, (leads.length / Number(count || 1)) * 100)}%` }}
            />
          </div>
          <div
            ref={logRef}
            className="mt-4 h-56 overflow-auto rounded-md border border-border bg-[oklch(0.14_0.03_260)] p-3 font-mono text-xs leading-relaxed text-[oklch(0.78_0.18_150)]"
          >
            {logs.map((l, i) => <div key={i}>{l}</div>)}
            {!logs.length && <div className="text-[oklch(0.5_0.05_150)]">Waiting for activity...</div>}
          </div>
        </div>
      )}

      {/* Leads Table */}
      {leads.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold">Leads ({leads.length})</h2>
            <Button onClick={exportExcel} variant="outline" size="sm">
              <Download /> Export to Excel
            </Button>
          </div>
          <LeadsTable leads={leads} />
          <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {sheetUrl
                ? <>Target sheet: <span className="text-foreground">{sheetUrl}</span></>
                : <>No Google Sheet saved. Add one in the Google Sheets tab.</>}
            </div>
            <div className="flex items-center gap-3">
              {syncMsg && (
                <span className={cn(
                  "text-xs",
                  syncMsg.type === "ok" ? "text-[oklch(0.7_0.18_150)]" : "text-destructive",
                )}>{syncMsg.text}</span>
              )}
              <Button
                onClick={handleManualSync}
                disabled={syncing || !lastJobId || !sheetUrl}
                size="sm"
              >
                {syncing ? <><Loader2 className="animate-spin" /> Syncing...</> : <><SheetIcon /> Sync to Google Sheets</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Leads Table -------------------- */
function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["#", "Name", "Category", "City", "Phone", "Email", "Website", "Rating", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-border hover:bg-secondary/30">
              <td className="px-4 py-3 text-muted-foreground">{l.id}</td>
              <td className="px-4 py-3 font-medium">{l.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.category}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.city}</td>
              <td className="px-4 py-3"><span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{l.phone || "—"}</span></td>
              <td className="px-4 py-3">{l.email || <span className="text-muted-foreground">—</span>}</td>
              <td className="px-4 py-3">
                {l.website ? (
                  <a href={l.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Globe className="h-3 w-3" /> Visit
                  </a>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                {l.rating ? (
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{l.rating}</span>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                <a href={l.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(l.name + " " + l.city)}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline"><ExternalLink /> Maps</Button>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- My Leads -------------------- */
function LeadsSection({ leads }: { leads: Lead[] }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Leads</h1>
        <p className="text-sm text-muted-foreground">All leads from your current session.</p>
      </div>
      {leads.length === 0 ? (
        <EmptyState title="No leads yet" desc="Run a search from the Dashboard to populate this list." />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <LeadsTable leads={leads} />
        </div>
      )}
    </div>
  );
}

/* -------------------- Google Sheets -------------------- */
function SheetsSection({
  sheetUrl, setSheetUrl, googleConnected, setGoogleConnected, sheetVerified, setSheetVerified,
}: {
  sheetUrl: string; setSheetUrl: (s: string) => void;
  googleConnected: boolean; setGoogleConnected: (b: boolean) => void;
  sheetVerified: boolean; setSheetVerified: (b: boolean) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>("");
  const [sheetError, setSheetError] = useState<string>("");
  const [sheetsList, setSheetsList] = useState<Array<{ name: string; url: string }>>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Check existing auth status on mount
  useEffect(() => {
    // Handle OAuth redirect: ?sheets_connected=true&user_id=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sheets_connected") === "true") {
        const returnedUserId = params.get("user_id");
        if (returnedUserId) {
          localStorage.setItem("leadora_user_id", returnedUserId);
        }
        setGoogleConnected(true);
        // Clean the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("sheets_connected");
        url.searchParams.delete("user_id");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        return;
      }
    }
    const userId = getUserId();
    fetch(`${API_BASE}/auth/status/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.authenticated) setGoogleConnected(true); })
      .catch(() => {});
  }, [setGoogleConnected]);

  const connectGoogle = async () => {
    setAuthError(null);
    setConnecting(true);
    try {
      const userId = getUserId();
      const res = await fetch(`${API_BASE}/auth/login?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`auth/login failed: ${res.status}`);
      const json = await res.json();
      const authUrl = json.auth_url;
      if (!authUrl) throw new Error("No auth_url returned");
      window.open(authUrl, "_self");
    } catch (e: any) {
      setAuthError(e.message);
      setConnecting(false);
    }
  };

  const loadSheets = async () => {
    setLoadingSheets(true);
    setSheetsError(null);
    setSheetsList([]);
    try {
      const userId = getUserId();
      const res = await fetch(`${API_BASE}/sheets/list?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Failed to load sheets: ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json.sheets)
        ? json.sheets
        : Array.isArray(json)
          ? json
          : [];
      const normalized = list
        .filter((s: any) => s && (s.url || s.id))
        .map((s: any) => ({
          name: s.name ?? s.title ?? s.sheet_name ?? "Untitled Sheet",
          url: s.url ?? `https://docs.google.com/spreadsheets/d/${s.id}/edit`,
        }));
      if (normalized.length === 0) {
        setSheetsError("No sheets found. Please paste a URL manually.");
      } else {
        setSheetsList(normalized);
      }
    } catch (e: any) {
      setSheetsError("Could not load sheets. Please paste URL manually.");
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = (url: string) => {
    setSheetUrl(url);
    setSheetVerified(false);
    setSheetTitle("");
    setSheetError("");
  };

  const verifySheet = async () => {
    setTesting(true);
    setSheetError("");
    setSheetVerified(false);
    setSheetTitle("");
    try {
      const res = await fetch(`${API_BASE}/sheets/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: getUserId(), sheet_url: sheetUrl, sheet_name: "Leads" }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && (j.success ?? j.ok)) {
        setSheetVerified(true);
        setSheetTitle(j.sheet_title ?? j.title ?? j.spreadsheet_title ?? "Spreadsheet");
      } else {
        setSheetError(j.error ?? j.message ?? "Could not access sheet");
      }
    } catch (e: any) {
      setSheetError(e.message ?? "Network error");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    const userId = getUserId();
    try { await fetch(`${API_BASE}/auth/revoke/${userId}`, { method: "POST" }); } catch {}
    setGoogleConnected(false);
    setSheetVerified(false);
    setSheetUrl("");
    setSheetTitle("");
    setSheetError("");
    setSheetsList([]);
    setSheetsError(null);
    setManualMode(false);
    setAuthError(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Sheets</h1>
        <p className="text-sm text-muted-foreground">Sync leads directly into a spreadsheet.</p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        {!googleConnected ? (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Google account to sync leads into your spreadsheets.
            </p>
            <button
              onClick={connectGoogle}
              disabled={connecting}
              className="inline-flex items-center gap-3 rounded-md border border-[#dadce0] bg-white px-5 h-11 text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa] disabled:opacity-60"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.61z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
              )}
              {connecting ? "Waiting for Google..." : "Connect Google Account"}
            </button>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-md border border-[oklch(0.7_0.18_150)]/40 bg-[oklch(0.7_0.18_150)]/10 p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.18_150)]" />
                <span className="font-medium text-[oklch(0.45_0.18_150)]">✅ Google Account Connected</span>
              </div>
              <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2">
                Disconnect
              </button>
            </div>

            {/* Sheet selection UI */}
            {!manualMode && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={loadSheets}
                  disabled={loadingSheets}
                  className="w-full justify-start gap-2"
                >
                  {loadingSheets ? <Loader2 className="h-4 w-4 animate-spin" /> : <SheetIcon className="h-4 w-4" />}
                  {loadingSheets ? "Loading your sheets..." : "Load My Sheets"}
                </Button>

                {sheetsError && (
                  <p className="text-sm text-destructive">{sheetsError}</p>
                )}

                {sheetsList.length > 0 && (
                  <div className="space-y-1">
                    <Label htmlFor="sheet-select">Select a spreadsheet</Label>
                    <Select
                      value={sheetUrl}
                      onValueChange={handleSelectSheet}
                    >
                      <SelectTrigger id="sheet-select" aria-label="Select a spreadsheet">
                        <SelectValue placeholder="Choose a sheet..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetsList.map((s) => (
                          <SelectItem key={s.url} value={s.url}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setManualMode(true); setSheetsError(null); }}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                >
                  Or paste URL manually
                </button>
              </div>
            )}

            {manualMode && (
              <div className="space-y-2">
                <Label htmlFor="url">Google Sheet URL</Label>
                <Input id="url" placeholder="Paste your Google Sheet URL here"
                  value={sheetUrl}
                  onChange={(e) => { setSheetUrl(e.target.value); setSheetVerified(false); setSheetTitle(""); setSheetError(""); }} />
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setSheetsError(null); }}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                >
                  Back to Load My Sheets
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={verifySheet} disabled={testing || !sheetUrl}>
                {testing ? <Loader2 className="animate-spin" /> : null} Verify Sheet
              </Button>
            </div>
            {sheetVerified && (
              <div className="flex items-center gap-2 rounded-md border border-[oklch(0.7_0.18_150)]/40 bg-[oklch(0.7_0.18_150)]/10 p-3 text-sm text-[oklch(0.45_0.18_150)]">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.18_150)]" />
                <span className="font-medium">✅ Sheet Connected: {sheetTitle}</span>
              </div>
            )}
            {sheetError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{sheetError}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------- Settings -------------------- */
function SettingsSection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">App preferences and backend configuration.</p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-2">
          <Label htmlFor="backend-url">Backend API URL</Label>
          <Input id="backend-url" type="password" defaultValue={API_BASE} />
          <p className="text-xs text-muted-foreground">Hidden by default to avoid leaking infrastructure details.</p>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label htmlFor="auto-export" className="text-sm font-medium cursor-pointer">Auto-export to Excel</Label>
            <div className="text-xs text-muted-foreground">Download a CSV automatically when a run completes.</div>
          </div>
          <Switch id="auto-export" />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label htmlFor="email-enrich" className="text-sm font-medium cursor-pointer">Email enrichment by default</Label>
            <div className="text-xs text-muted-foreground">Toggle "Find Emails" on for every new search.</div>
          </div>
          <Switch id="email-enrich" defaultChecked />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
      <Users className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

/* -------------------- Normalize API result to Lead -------------------- */
function normalizeLead(r: any, id: number, businessType: string, city: string): Lead {
  return {
    id,
    name: r.name ?? r.business_name ?? r.title ?? "",
    category: r.category ?? r.type ?? businessType,
    city: r.city ?? r.location ?? city,
    phone: r.phone ?? r.phone_number ?? r.tel ?? "",
    email: r.email ?? "",
    website: r.website ?? r.url ?? r.site ?? "",
    rating: r.rating ?? r.stars ?? "",
    mapsUrl: r.maps_url ?? r.mapsUrl ?? r.google_maps_url ?? r.link ?? "",
  };
}
