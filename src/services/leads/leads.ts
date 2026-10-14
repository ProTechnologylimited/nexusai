import type { LeadStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseCsv, toCsv } from "@/lib/csv";
import { enqueueLeadCreated } from "@/services/workflows/workflows";

export const IMPORT_MAX_ROWS = 1000;
type LeadData = {
  name: string; company?: string; email?: string; website?: string; industry?: string;
  jobTitle?: string; source?: string; status?: LeadStatus; followUpDate?: string; notes?: string;
};

const clean = (d: LeadData) => ({
  name: d.name,
  company: d.company || null,
  email: d.email || null,
  website: d.website || null,
  industry: d.industry || null,
  jobTitle: d.jobTitle || null,
  source: d.source || null,
  notes: d.notes || null,
  ...(d.status && { status: d.status }),
  followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
});

export async function listLeads(workspaceId: string, opts: { q?: string; status?: LeadStatus }) {
  const where: Prisma.LeadWhereInput = { workspaceId };
  if (opts.status) where.status = opts.status;
  if (opts.q) {
    where.OR = ["name", "company", "email"].map((f) => ({ [f]: { contains: opts.q, mode: "insensitive" } }));
  }
  const [leads, total] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    db.lead.count({ where }),
  ]);
  return { leads, total };
}

export const getLead = (workspaceId: string, id: string) => db.lead.findFirst({ where: { id, workspaceId } });

export async function createLead(workspaceId: string, actorId: string, data: LeadData) {
  const lead = await db.$transaction(async (tx) => {
    const l = await tx.lead.create({ data: { ...clean(data), workspaceId, ownerId: actorId } });
    await tx.activityLog.create({ data: { workspaceId, actorId, action: "lead.created", summary: `Added lead "${l.name}"` } });
    return l;
  });
  await enqueueLeadCreated(workspaceId, lead.id); // never throws
  return lead;
}

export async function updateLead(workspaceId: string, actorId: string, id: string, data: LeadData) {
  const res = await db.lead.updateMany({ where: { id, workspaceId }, data: clean(data) });
  if (res.count === 0) return false;
  await db.activityLog.create({ data: { workspaceId, actorId, action: "lead.updated", summary: `Updated lead "${data.name}"` } });
  return true;
}

const HEADER_MAP: Record<string, keyof LeadData> = {
  name: "name", "contact name": "name", "full name": "name", company: "company", email: "email",
  "business email": "email", website: "website", industry: "industry", "job title": "jobTitle",
  jobtitle: "jobTitle", title: "jobTitle", source: "source", notes: "notes",
};

export async function importLeads(workspaceId: string, actorId: string, csvText: string) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return { error: "The file needs a header row and at least one lead." as const };
  if (rows.length - 1 > IMPORT_MAX_ROWS) return { error: `Import up to ${IMPORT_MAX_ROWS} leads at a time.` as const };

  const cols = rows[0].map((h) => HEADER_MAP[h.trim().toLowerCase()]);
  if (!cols.includes("name")) return { error: 'Add a "name" column so each lead has a contact name.' as const };

  const parsed: LeadData[] = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const rec: Record<string, string> = {};
    cols.forEach((key, i) => { if (key && r[i]) rec[key] = r[i].trim(); });
    const emailOk = !rec.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rec.email);
    if (!rec.name || !emailOk) { skipped++; continue; }
    if (rec.email) rec.email = rec.email.toLowerCase();
    if (rec.website && !/^https?:\/\//i.test(rec.website)) delete rec.website;
    parsed.push(rec as unknown as LeadData);
  }

  const emails = parsed.map((p) => p.email).filter((e): e is string => !!e);
  const existing = new Set(
    (await db.lead.findMany({ where: { workspaceId, email: { in: emails } }, select: { email: true } })).map((l) => l.email),
  );
  const seen = new Set<string>();
  const fresh = parsed.filter((p) => {
    if (!p.email) return true;
    if (existing.has(p.email) || seen.has(p.email)) { skipped++; return false; }
    seen.add(p.email);
    return true;
  });

  if (fresh.length) {
    await db.$transaction([
      db.lead.createMany({ data: fresh.map((p) => ({ ...clean(p), workspaceId, ownerId: actorId, source: p.source || "CSV import" })) }),
      db.activityLog.create({ data: { workspaceId, actorId, action: "lead.imported", summary: `Imported ${fresh.length} leads from CSV` } }),
    ]);
  }
  return { created: fresh.length, skipped };
}

export async function exportLeadsCsv(workspaceId: string) {
  const leads = await db.lead.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 10_000 });
  return toCsv([
    ["name", "company", "email", "website", "industry", "job title", "source", "status", "follow-up date", "notes", "created"],
    ...leads.map((l) => [
      l.name, l.company, l.email, l.website, l.industry, l.jobTitle, l.source, l.status,
      l.followUpDate?.toISOString().slice(0, 10), l.notes, l.createdAt.toISOString(),
    ]),
  ]);
}
