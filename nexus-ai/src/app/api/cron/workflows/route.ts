import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processPending } from "@/services/workflows/workflows";

// Worker endpoint. Call it every minute from a scheduler (Vercel Cron, GitHub Actions, cron-job.org, etc.)
// with the header:  Authorization: Bearer <CRON_SECRET>
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "CRON_SECRET is not configured (min 16 chars)." }, { status: 503 });
  }
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const processed = await processPending(25);
  return NextResponse.json({ processed });
}

export const GET = handle;
export const POST = handle;
