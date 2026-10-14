import type { Metadata } from "next";
import { LeadForm } from "@/components/leads/lead-form";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Add lead" };

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Add lead</h1>
      <Card className="mt-8 p-6"><LeadForm /></Card>
    </div>
  );
}
