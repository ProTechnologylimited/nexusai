"use server";

import { revalidatePath } from "next/cache";
import type { ZodTypeAny } from "zod";
import { companySchema, contactSchema, dealSchema, stageSchema, toCents } from "@/lib/validation/crm";
import { requireWorkspaceContext } from "@/lib/workspace";
import { CrmError, createCompany, createContact, createDeal, moveDeal } from "@/services/crm/crm";

export type CrmResult = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

function parse<T extends ZodTypeAny>(schema: T, values: unknown) {
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data as ReturnType<T["parse"]> };
  const fieldErrors: Record<string, string> = {};
  for (const i of r.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  return { fieldErrors };
}

async function guarded(fn: () => Promise<void>): Promise<CrmResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof CrmError) return { error: e.message };
    throw e;
  }
  revalidatePath("/crm");
  return { ok: true };
}

export async function createCompanyAction(values: unknown): Promise<CrmResult> {
  const ctx = await requireWorkspaceContext();
  const p = parse(companySchema, values);
  if (!p.data) return { fieldErrors: p.fieldErrors };
  return guarded(() => createCompany(ctx.workspace.id, ctx.user.id, p.data));
}

export async function createContactAction(values: unknown): Promise<CrmResult> {
  const ctx = await requireWorkspaceContext();
  const p = parse(contactSchema, values);
  if (!p.data) return { fieldErrors: p.fieldErrors };
  return guarded(() => createContact(ctx.workspace.id, ctx.user.id, p.data));
}

export async function createDealAction(values: unknown): Promise<CrmResult> {
  const ctx = await requireWorkspaceContext();
  const p = parse(dealSchema, values);
  if (!p.data) return { fieldErrors: p.fieldErrors };
  const d = p.data;
  return guarded(() => createDeal(ctx.workspace.id, ctx.user.id, { ...d, valueCents: toCents(d.value) }));
}

export async function moveDealAction(values: unknown): Promise<CrmResult> {
  const ctx = await requireWorkspaceContext();
  const p = parse(stageSchema, values);
  if (!p.data) return { error: "Invalid stage." };
  return guarded(() => moveDeal(ctx.workspace.id, ctx.user.id, p.data.id, p.data.stage));
}
