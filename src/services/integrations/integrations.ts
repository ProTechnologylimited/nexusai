import { db } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { findIntegration } from "./registry";

export class IntegrationError extends Error {}

export async function getChecks(workspaceId: string) {
  const rows = await db.integrationCheck.findMany({ where: { workspaceId } });
  return new Map(rows.map((r) => [r.key, { ok: r.ok, message: r.message, checkedAt: r.checkedAt }]));
}

/** Runs a real connection check and records the outcome. Never stores or returns credentials. */
export async function runCheck(workspaceId: string, actorId: string, key: string) {
  const integ = findIntegration(key);
  if (!integ || integ.planned || !integ.check) throw new IntegrationError("This integration cannot be checked.");
  if (!integ.isConfigured()) throw new IntegrationError(`Not configured. Set: ${integ.envVars.join(", ")}.`);
  if (!rateLimit(`integration-check:${workspaceId}:${key}`, 1, 10_000).ok) throw new IntegrationError("Wait a few seconds before checking again.");

  const result = await integ.check();
  await db.integrationCheck.upsert({
    where: { workspaceId_key: { workspaceId, key } },
    create: { workspaceId, key, ok: result.ok, message: result.message },
    update: { ok: result.ok, message: result.message, checkedAt: new Date() },
  });
  await db.activityLog.create({
    data: { workspaceId, actorId, action: "integration.checked", summary: `${integ.name} connection check ${result.ok ? "passed" : "failed"}` },
  });
  return result;
}
