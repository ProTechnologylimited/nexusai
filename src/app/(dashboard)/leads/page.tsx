import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ImportPanel } from "@/components/leads/import-panel";
import { Card, buttonClasses } from "@/components/ui/primitives";
import { LEAD_STATUSES } from "@/lib/validation/leads";
import { requireWorkspaceContext } from "@/lib/workspace";
import { listLeads } from "@/services/leads/leads";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const { workspace } = await requireWorkspaceContext();
  const status = LEAD_STATUSES.find((s) => s === sp.status);
  const { leads, total } = await listLeads(workspace.id, { q: sp.q?.slice(0, 100), status });
  const filtered = !!(sp.q || status);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted">Capture, qualify, and track prospects.</p>
        </div>
        <Link href="/leads/new" className={buttonClasses("primary")}><Plus className="size-4" aria-hidden="true" /> Add lead</Link>
      </div>

      <div className="mt-6"><ImportPanel /></div>
      <p className="mt-2 text-xs text-muted">CSV columns: name (required), company, email, website, industry, job title, source, notes.</p>

      <form method="get" className="mt-6 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={sp.q} aria-label="Search leads" placeholder="Search name, company, or email" className="min-h-10 w-full max-w-xs rounded-lg border border-line bg-white px-3 text-sm" />
        <select name="status" defaultValue={status ?? ""} aria-label="Filter by status" className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm">
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
        </select>
        <button type="submit" className={buttonClasses("secondary")}>Apply</button>
      </form>

      {leads.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <h2 className="font-semibold">{filtered ? "No leads match your filters" : "No leads yet"}</h2>
          <p className="mt-1 text-sm text-muted">{filtered ? "Clear the search or choose another status." : "Add a lead manually or import a CSV file."}</p>
        </Card>
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Company</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Follow-up</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="p-4"><Link href={`/leads/${l.id}`} className="font-medium text-brand hover:underline">{l.name}</Link></td>
                  <td className="p-4">{l.company ?? "-"}</td>
                  <td className="p-4 text-muted">{l.email ?? "-"}</td>
                  <td className="p-4">{l.status.toLowerCase()}</td>
                  <td className="p-4 text-muted">{l.followUpDate ? l.followUpDate.toISOString().slice(0, 10) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-4 text-xs text-muted">Showing {leads.length} of {total}.</p>
        </Card>
      )}
    </div>
  );
}
