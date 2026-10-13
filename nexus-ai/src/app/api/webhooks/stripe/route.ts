import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/security/stripe-signature";
import { handleStripeEvent, type StripeEvent } from "@/services/billing/webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });

  const raw = await req.text(); // signature is computed over the exact raw body
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return NextResponse.json({ received: true, result });
  } catch {
    console.error("stripe webhook processing failed", event.id);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}
