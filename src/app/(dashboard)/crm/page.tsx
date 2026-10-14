import type { Metadata } from "next";
import Link from "next/link";
import { RecordForm } from "@/components/crm/record-form";
import { StageSelect } from "@/components/crm/stage-select";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { DEAL_STAGES } from "@/lib/validation/crm";
import { requireWorkspaceContext } from "@/lib/workspace";
import { companyOptions, listCompanies, listContacts, listDeals } from "@/services/crm/crm";

export const metadata: Metadata = { title: "CRM" };

const TABS = [["deals", "Deals"], ["contacts", "Contacts"], ["companies", "Companies"]] as const;
const money = (cents: number | null, cur: string) =>
  cents == null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(cents / 100);

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab = TABS.find(([k]) => k === raw)?.[0] ?? "deals";
  const { workspace } = await requireWorkspaceContext();
  const companies = await companyOptions(workspace.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="mt-1 text-sm text-muted">Contacts, companies, and deals.</p>
      </div>

      <nav aria-label="CRM sections" className="flex gap-1 border-b border-line">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/crm?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium", tab === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink")}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === "deals" && (
        <>
          <RecordForm kind="deal" companies={companies} />
          <DealBoard workspaceId={workspace.id} />
        </>
      )}
      {tab === "contacts" && (
        <>
          <RecordForm kind="contact" companies={companies} />
          <ContactsTable workspaceId={workspace.id} />
        </>
      )}
      {tab === "companies" && (
        <>
          <RecordForm kind="company" companies={companies} />
          <CompaniesTable workspaceId={workspace.id} />
        </>
      )}
    </div>
  );
}

async function DealBoard({ workspaceId }: { workspaceId: string }) {
  const deals = await listDeals(workspaceId);
  if (deals.length === 0) return <Empty text="No deals yet. Add a deal to start tracking your pipeline." />;
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {DEAL_STAGES.map((stage) => {
        const col = deals.filter((d) => d.stage === stage);
        const totals = new Map<string, number>();
        for (const d of col) if (d.valueCents != null) totals.set(d.currency, (totals.get(d.currency) ?? 0) + d.valueCents);
        return (
          <section key={stage} aria-label={`${stage.toLowerCase()} deals`} className="w-64 shrink-0 rounded-xl bg-slate-100 p-3">
            <h2 className="text-sm font-semibold">{stage[0] + stage.slice(1).toLowerCase()} <span className="font-normal text-muted">({col.length})</span></h2>
            <p className="text-xs text-muted">{totals.size ? [...totals].map(([c, v]) => money(v, c)).join(" + ") : "No value"}</p>
            <ul className="mt-3 space-y-2">
              {col.map((d) => (
                <li key={d.id} className="rounded-lg border border-line bg-white p-3 text-sm">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted">{d.company?.name ?? "No company"} · {money(d.valueCents, d.currency)}</p>
                  {d.expectedCloseDate && <p className="text-xs text-muted">Close {d.expectedCloseDate.toISOString().slice(0, 10)}</p>}
                  <StageSelect id={d.id} stage={d.stage} name={d.name} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

async function ContactsTable({ workspaceId }: { workspaceId: string }) {
  const rows = await listContacts(workspaceId);
  if (rows.length === 0) return <Empty text="No contacts yet. Add one to start building your customer list." />;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-line text-muted"><tr>{["Name", "Company", "Email", "Phone", "Tags"].map((h) => <th key={h} className="p-4 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => (
            <tr key={c.id}><td className="p-4 font-medium">{c.name}</td><td className="p-4">{c.company?.name ?? "-"}</td><td className="p-4 text-muted">{c.email ?? "-"}</td><td className="p-4 text-muted">{c.phone ?? "-"}</td><td className="p-4 text-muted">{c.tags.join(", ") || "-"}</td></tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

async function CompaniesTable({ workspaceId }: { workspaceId: string }) {
  const rows = await listCompanies(workspaceId);
  if (rows.length === 0) return <Empty text="No companies yet. Add one to group your contacts and deals." />;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-line text-muted"><tr>{["Name", "Industry", "Size", "Contacts", "Deals"].map((h) => <th key={h} className="p-4 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => (
            <tr key={c.id}><td className="p-4 font-medium">{c.name}</td><td className="p-4">{c.industry ?? "-"}</td><td className="p-4 text-muted">{c.size ?? "-"}</td><td className="p-4">{c._count.contacts}</td><td className="p-4">{c._count.deals}</td></tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <Card className="p-10 text-center text-sm text-muted">{text}</Card>;
}
