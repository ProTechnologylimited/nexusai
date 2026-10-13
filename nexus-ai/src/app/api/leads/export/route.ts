import { getWorkspaceContext } from "@/lib/workspace";
import { exportLeadsCsv } from "@/services/leads/leads";

export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx || ctx.stale) return new Response("Unauthorized", { status: 401 });
  const csv = await exportLeadsCsv(ctx.workspace.id);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="nexus-leads.csv"',
      "cache-control": "no-store",
    },
  });
}
