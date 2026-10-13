// Email provider integration (Resend). Keys stay on the server.
export type EmailConfig = { configured: boolean; missing: string[] };

const REQUIRED = ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_FOOTER_ADDRESS", "APP_URL"] as const;

export function getEmailConfig(): EmailConfig {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return { configured: missing.length === 0, missing };
}

export class EmailProviderError extends Error {}

export async function sendViaResend(opts: { to: string; subject: string; text: string; unsubscribeUrl: string; idempotencyKey: string }) {
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": opts.idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        headers: { "List-Unsubscribe": `<${opts.unsubscribeUrl}>` },
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new EmailProviderError("Could not reach the email provider.");
  }
  if (!res.ok) throw new EmailProviderError(`The email provider rejected the message (HTTP ${res.status}).`);
  const data = (await res.json()) as { id?: string };
  return { providerMessageId: data.id ?? null };
}

// Account emails (password reset, verification). Needs no postal address or unsubscribe link.
export function getTransactionalConfig(): EmailConfig {
  const missing = ["RESEND_API_KEY", "EMAIL_FROM", "APP_URL"].filter((k) => !process.env[k]);
  return { configured: missing.length === 0, missing };
}

export async function sendTransactional(opts: { to: string; subject: string; text: string }) {
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [opts.to], subject: opts.subject, text: opts.text }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new EmailProviderError("Could not reach the email provider.");
  }
  if (!res.ok) throw new EmailProviderError(`The email provider rejected the message (HTTP ${res.status}).`);
}
