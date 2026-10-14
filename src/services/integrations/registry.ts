import { anthropicProvider } from "@/services/ai/anthropic";
import { getEmailConfig } from "@/services/email/provider";

export type Integration = {
  key: string;
  name: string;
  category: string;
  description: string;
  capabilities: string[];
  envVars: string[];
  planned?: boolean;
  check?: () => Promise<{ ok: boolean; message: string }>;
  isConfigured: () => boolean;
};

async function http(url: string, headers: Record<string, string>) {
  try {
    return await fetch(url, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch {
    return null;
  }
}

// Credentials come from server environment variables only; they are never sent to the browser.
export const INTEGRATIONS: Integration[] = [
  {
    key: "anthropic", name: "Anthropic Claude", category: "AI model provider",
    description: "Powers AI agents, campaign drafts, email drafts, and workflow drafting steps.",
    capabilities: ["Agent runs", "Campaign drafts", "Email drafts"], envVars: ["ANTHROPIC_API_KEY"],
    isConfigured: () => anthropicProvider.isConfigured(),
    async check() {
      const res = await http("https://api.anthropic.com/v1/models", { "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01" });
      if (!res) return { ok: false, message: "Could not reach Anthropic." };
      if (res.ok) return { ok: true, message: "Credentials accepted by Anthropic." };
      return { ok: false, message: res.status === 401 ? "Anthropic rejected the API key." : `Anthropic returned HTTP ${res.status}.` };
    },
  },
  {
    key: "resend", name: "Resend", category: "Email service",
    description: "Sends approved one-to-one emails to your leads.",
    capabilities: ["Send approved emails", "Idempotent retries"], envVars: ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_FOOTER_ADDRESS", "APP_URL"],
    isConfigured: () => getEmailConfig().configured,
    async check() {
      const res = await http("https://api.resend.com/domains", { authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}` });
      if (!res) return { ok: false, message: "Could not reach Resend." };
      if (res.ok) return { ok: true, message: "Credentials accepted by Resend." };
      if (res.status === 401) {
        const body = (await res.json().catch(() => ({}))) as { name?: string };
        if (body.name === "restricted_api_key") return { ok: true, message: "Key is valid but restricted to sending, so the sender domain could not be inspected." };
        return { ok: false, message: "Resend rejected the API key." };
      }
      return { ok: false, message: `Resend returned HTTP ${res.status}.` };
    },
  },
  {
    key: "stripe", name: "Stripe", category: "Payments",
    description: "Subscription checkout, customer portal, and signed billing webhooks. Plans change only after a verified webhook.",
    capabilities: ["Checkout", "Customer portal", "Verified webhooks"],
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_STARTER", "STRIPE_PRICE_GROWTH", "STRIPE_PRICE_BUSINESS", "APP_URL"],
    isConfigured: () => !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET && !!process.env.APP_URL,
    async check() {
      const res = await http("https://api.stripe.com/v1/balance", { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY ?? ""}` });
      if (!res) return { ok: false, message: "Could not reach Stripe." };
      if (res.ok) return { ok: true, message: "Credentials accepted by Stripe." };
      return { ok: false, message: res.status === 401 ? "Stripe rejected the secret key." : `Stripe returned HTTP ${res.status}.` };
    },
  },
  { key: "webhooks", name: "Outgoing webhooks", category: "Webhooks", description: "Send workflow events to your own systems.", capabilities: [], envVars: [], planned: true, isConfigured: () => false },
  { key: "crm-sync", name: "External CRM sync", category: "CRM tools", description: "Two-way sync with other CRM software.", capabilities: [], envVars: [], planned: true, isConfigured: () => false },
  { key: "social", name: "Social and ad platforms", category: "Marketing platforms", description: "Publish campaigns and pull performance metrics.", capabilities: [], envVars: [], planned: true, isConfigured: () => false },
];

export const findIntegration = (key: string) => INTEGRATIONS.find((i) => i.key === key);
