import type { Metadata } from "next";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Create campaign" };

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Create campaign</h1>
      <Card className="mt-8 p-6"><CampaignForm /></Card>
    </div>
  );
}
