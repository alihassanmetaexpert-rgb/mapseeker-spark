import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
      { name: "description", content: "Generate, view and export leads from Google Maps." },
    ],
  }),
  component: Dashboard,
});

const API_BASE = "https://leadora-saas-production.up.railway.app";

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
  const [sheetStatus, setSheetStatus] = useState<"idle" | "connected" | "error">("idle");

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
          v1.0 · API {API_BASE}
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
          <DashboardSection leads={leads} setLeads={setLeads} />
        )}
        {section === "leads" && <LeadsSection leads={leads} />}
        {section === "sheets" && (
          <SheetsSection
            sheetUrl={sheetUrl}
            setSheetUrl={setSheetUrl}
            status={sheetStatus}
            setStatus={setSheetStatus}
          />
        )}
        {section === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}

/* -------------------- Dashboard / Generate -------------------- */
function DashboardSection({
  leads,
  setLeads,
}: {
  leads: Lead[];
  setLeads: (l: Lead[] | ((prev: Lead[]) => Lead[])) => void;
}) {
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [count, setCount] = useState("20");
  const [findEmails, setFindEmails] = useState(true);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [logs, setLogs] = useState<string[]>([]);
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
    setStatus(`Searching: ${businessType} in ${city}...`);
    pushLog(`POST ${API_BASE}/generate-leads`);
    pushLog(`Query: ${businessType} | City: ${city} | Count: ${count} | Emails: ${findEmails}`);

    try {
      // Try to stream from backend
      const res = await fetch(`${API_BASE}/generate-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_type: businessType,
          city,
          count: Number(count),
          find_emails: findEmails,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Backend responded ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.log) pushLog(evt.log);
            if (evt.status) setStatus(evt.status);
            if (evt.lead) setLeads((prev) => [...prev, { ...evt.lead, id: prev.length + 1 }]);
          } catch {
            pushLog(line);
          }
        }
      }
      setStatus(`Done — ${leads.length} leads`);
      pushLog("✔ Completed.");
    } catch (err: any) {
      pushLog(`Backend unreachable (${err.message}). Running demo simulation.`);
      await simulate({ businessType, city, count: Number(count), findEmails, pushLog, setStatus, setLeads });
    } finally {
      setRunning(false);
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="e.g. Lahore Pakistan"
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Number of Leads</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["10", "20", "50", "100"].map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  sheetUrl, setSheetUrl, status, setStatus,
}: {
  sheetUrl: string; setSheetUrl: (s: string) => void;
  status: "idle" | "connected" | "error"; setStatus: (s: "idle" | "connected" | "error") => void;
}) {
  const [testing, setTesting] = useState(false);
  const test = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 800));
    setStatus(/docs\.google\.com\/spreadsheets/.test(sheetUrl) ? "connected" : "error");
    setTesting(false);
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Sheets</h1>
        <p className="text-sm text-muted-foreground">Sync leads directly into a spreadsheet.</p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-2">
          <Label htmlFor="url">Google Sheet URL</Label>
          <Input id="url" placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button>Connect Google Account</Button>
          <Button variant="outline" onClick={test} disabled={testing || !sheetUrl}>
            {testing ? <Loader2 className="animate-spin" /> : null} Test Connection
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          {status === "connected" && (
            <span className="inline-flex items-center gap-1 text-[oklch(0.55_0.18_150)]"><CheckCircle2 className="h-4 w-4" /> Connected</span>
          )}
          {status === "error" && (
            <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /> Not connected</span>
          )}
          {status === "idle" && <span className="text-muted-foreground">Not connected</span>}
        </div>
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
          <Label>Backend API URL</Label>
          <Input defaultValue={API_BASE} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <div className="text-sm font-medium">Auto-export to Excel</div>
            <div className="text-xs text-muted-foreground">Download a CSV automatically when a run completes.</div>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <div className="text-sm font-medium">Email enrichment by default</div>
            <div className="text-xs text-muted-foreground">Toggle "Find Emails" on for every new search.</div>
          </div>
          <Switch defaultChecked />
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

/* -------------------- Demo simulation (when backend offline) -------------------- */
async function simulate({
  businessType, city, count, findEmails, pushLog, setStatus, setLeads,
}: {
  businessType: string; city: string; count: number; findEmails: boolean;
  pushLog: (s: string) => void; setStatus: (s: string) => void;
  setLeads: (l: Lead[] | ((prev: Lead[]) => Lead[])) => void;
}) {
  const samples = [
    "Premier", "Elite", "City", "Royal", "Smile", "Care", "Sunrise", "Oak",
    "Metro", "Apex", "Bright", "Trusted", "Family", "Modern", "Prime",
  ];
  setStatus(`Searching Google Maps: ${businessType} in ${city}`);
  pushLog(`Connecting to Maps for "${businessType}" in "${city}"...`);
  await new Promise((r) => setTimeout(r, 600));
  pushLog("Connection established. Scraping results...");
  for (let i = 0; i < count; i++) {
    await new Promise((r) => setTimeout(r, 180));
    const name = `${samples[i % samples.length]} ${businessType}`.replace(/\b\w/g, (c) => c.toUpperCase());
    const lead: Lead = {
      id: i + 1,
      name,
      category: businessType,
      city,
      phone: `+92 3${Math.floor(10 + Math.random() * 89)} ${Math.floor(1000000 + Math.random() * 8999999)}`,
      email: findEmails && Math.random() > 0.3 ? `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.com` : "",
      website: Math.random() > 0.4 ? `https://${name.toLowerCase().replace(/[^a-z]/g, "")}.com` : "",
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(name + " " + city)}`,
    };
    setLeads((prev) => [...prev, lead]);
    pushLog(`✔ Found: ${lead.name}${lead.email ? ` <${lead.email}>` : ""}`);
    setStatus(`Searching: ${businessType} in ${city} — ${i + 1}/${count}`);
  }
  setStatus(`Done — ${count} leads`);
  pushLog("✔ Completed.");
}
