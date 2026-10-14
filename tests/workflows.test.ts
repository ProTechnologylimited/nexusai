import { describe, expect, it } from "vitest";
import { evaluateConditions, idempotencyKeyForLeadCreated, nextStepIndex, renderTemplate, type RuleLead } from "@/services/workflows/rules";
import { workflowSchema } from "@/lib/validation/workflows";

const lead: RuleLead = { name: "Jane", company: "Acme", email: "jane@acme.com", status: "NEW", source: "Web" };

describe("evaluateConditions", () => {
  it("passes with no conditions, even without a lead", () => expect(evaluateConditions([], null).ok).toBe(true));
  it("requires a lead when conditions exist", () => expect(evaluateConditions([{ field: "hasEmail" }], null).ok).toBe(false));
  it("checks email, status, and source", () => {
    expect(evaluateConditions([{ field: "hasEmail" }], lead).ok).toBe(true);
    expect(evaluateConditions([{ field: "hasEmail" }], { ...lead, email: null }).ok).toBe(false);
    expect(evaluateConditions([{ field: "status", value: "QUALIFIED" }], lead).ok).toBe(false);
    expect(evaluateConditions([{ field: "source", value: "web" }], lead).ok).toBe(true);
  });
});

describe("renderTemplate", () => {
  it("fills lead fields and blanks missing ones", () => {
    expect(renderTemplate("Hi {{lead.name}} at {{ lead.company }}", lead)).toBe("Hi Jane at Acme");
    expect(renderTemplate("Hi {{lead.name}}", null)).toBe("Hi ");
  });
});

describe("retry and idempotency helpers", () => {
  it("skips steps already completed", () => {
    const log = [{ index: 0, type: "NOTIFY", status: "done" as const, detail: "" }, { index: 1, type: "X", status: "failed" as const, detail: "" }];
    expect(nextStepIndex(log, 0)).toBe(false);
    expect(nextStepIndex(log, 1)).toBe(true);
  });
  it("derives a stable key per lead", () => expect(idempotencyKeyForLeadCreated("abc")).toBe(idempotencyKeyForLeadCreated("abc")));
});

describe("workflowSchema", () => {
  const ok = { name: "Follow up", trigger: "LEAD_CREATED", definition: { conditions: [{ field: "hasEmail" }], actions: [{ type: "NOTIFY", message: "Hi" }] } };
  it("accepts a valid workflow", () => expect(workflowSchema.safeParse(ok).success).toBe(true));
  it("requires at least one action", () => expect(workflowSchema.safeParse({ ...ok, definition: { conditions: [], actions: [] } }).success).toBe(false));
  it("rejects unknown action types and triggers", () => {
    expect(workflowSchema.safeParse({ ...ok, definition: { conditions: [], actions: [{ type: "RUN_SHELL", cmd: "ls" }] } }).success).toBe(false);
    expect(workflowSchema.safeParse({ ...ok, trigger: "CRON" }).success).toBe(false);
  });
});
