import type { DealStage } from "@prisma/client";
import { db } from "@/lib/db";

export class CrmError extends Error {}

/** A client-supplied companyId must belong to the same workspace, or it is rejected. */
async function ownedCompanyId(workspaceId: string, companyId?: string) {
  if (!companyId) return null;
  const c = await db.company.findFirst({ where: { id: companyId, workspaceId }, select: { id: true } });
  if (!c) throw new CrmError("Choose a company from your workspace.");
  return c.id;
}

const log = (workspaceId: string, actorId: string, action: string, summary: string) =>
  db.activityLog.create({ data: { workspaceId, actorId, action, summary } });

export const listCompanies = (workspaceId: string) =>
  db.company.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { contacts: true, deals: true } } } });

export const listContacts = (workspaceId: string) =>
  db.contact.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 200, include: { company: { select: { name: true } } } });

export const listDeals = (workspaceId: string) =>
  db.deal.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 500, include: { company: { select: { name: true } } } });

export const companyOptions = (workspaceId: string) =>
  db.company.findMany({ where: { workspaceId }, orderBy: { name: "asc" }, select: { id: true, name: true }, take: 500 });

export async function createCompany(workspaceId: string, actorId: string, d: { name: string; website?: string; industry?: string; size?: string; notes?: string }) {
  await db.company.create({ data: { workspaceId, name: d.name, website: d.website || null, industry: d.industry || null, size: d.size || null, notes: d.notes || null } });
  await log(workspaceId, actorId, "company.created", `Added company "${d.name}"`);
}

export async function createContact(
  workspaceId: string, actorId: string,
  d: { name: string; email?: string; phone?: string; source?: string; tags: string[]; companyId?: string; notes?: string },
) {
  const companyId = await ownedCompanyId(workspaceId, d.companyId);
  await db.contact.create({
    data: { workspaceId, companyId, name: d.name, email: d.email || null, phone: d.phone || null, source: d.source || null, tags: d.tags, notes: d.notes || null, ownerId: actorId },
  });
  await log(workspaceId, actorId, "contact.created", `Added contact "${d.name}"`);
}

export async function createDeal(
  workspaceId: string, actorId: string,
  d: { name: string; companyId?: string; valueCents: number | null; currency: string; stage: DealStage; expectedCloseDate?: string; notes?: string },
) {
  const companyId = await ownedCompanyId(workspaceId, d.companyId);
  await db.deal.create({
    data: {
      workspaceId, companyId, name: d.name, valueCents: d.valueCents, currency: d.currency, stage: d.stage,
      expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate) : null, notes: d.notes || null, ownerId: actorId,
    },
  });
  await log(workspaceId, actorId, "deal.created", `Added deal "${d.name}"`);
}

export async function moveDeal(workspaceId: string, actorId: string, id: string, stage: DealStage) {
  const deal = await db.deal.findFirst({ where: { id, workspaceId }, select: { name: true, stage: true } });
  if (!deal) throw new CrmError("Deal not found.");
  if (deal.stage === stage) return;
  await db.deal.updateMany({ where: { id, workspaceId }, data: { stage } });
  await log(workspaceId, actorId, "deal.moved", `Moved deal "${deal.name}" to ${stage.toLowerCase()}`);
}
