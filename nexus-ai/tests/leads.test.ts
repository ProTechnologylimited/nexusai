import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";
import { leadSchema } from "@/lib/validation/leads";

describe("parseCsv", () => {
  it("handles quotes, commas, escaped quotes, and CRLF", () => {
    const rows = parseCsv('name,notes\r\n"Doe, Jane","said ""hi"""\r\nBob,plain\r\n');
    expect(rows).toEqual([["name", "notes"], ["Doe, Jane", 'said "hi"'], ["Bob", "plain"]]);
  });
  it("keeps embedded newlines inside quotes and drops blank lines", () => {
    expect(parseCsv('a,b\n"x\ny",z\n\n')).toEqual([["a", "b"], ["x\ny", "z"]]);
  });
});

describe("toCsv", () => {
  it("escapes special characters", () => expect(toCsv([["a,b", 'c"d']])).toBe('"a,b","c""d"'));
  it("neutralizes formula injection", () => expect(toCsv([["=SUM(A1)", "+1", "ok"]])).toBe("'=SUM(A1),'+1,ok"));
  it("round-trips", () => {
    const data = [["name", "note"], ["A, B", 'x "y"']];
    expect(parseCsv(toCsv(data))).toEqual(data);
  });
});

describe("leadSchema", () => {
  const base = { name: "Jane", status: "NEW" as const };
  it("accepts minimal leads", () => expect(leadSchema.safeParse(base).success).toBe(true));
  it("rejects bad email and non-http website", () => {
    expect(leadSchema.safeParse({ ...base, email: "x" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, website: "javascript:alert(1)" }).success).toBe(false);
  });
  it("allows empty optional fields", () => expect(leadSchema.safeParse({ ...base, email: "", website: "" }).success).toBe(true));
});
