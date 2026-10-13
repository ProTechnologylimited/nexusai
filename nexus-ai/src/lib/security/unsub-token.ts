import { createHmac, timingSafeEqual } from "node:crypto";

const mac = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

/** Signed, tamper-proof token identifying (workspace, email) for one-click unsubscribe links. */
export function signUnsubToken(workspaceId: string, email: string, secret: string) {
  const payload = Buffer.from(JSON.stringify({ w: workspaceId, e: email.toLowerCase() })).toString("base64url");
  return `${payload}.${mac(payload, secret)}`;
}

export function verifyUnsubToken(token: string, secret: string): { workspaceId: string; email: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof o.w === "string" && typeof o.e === "string" ? { workspaceId: o.w, email: o.e } : null;
  } catch {
    return null;
  }
}
