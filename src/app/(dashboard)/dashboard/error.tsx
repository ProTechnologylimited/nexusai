"use client";

import { Button } from "@/components/ui/primitives";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-xl font-semibold">We couldn&apos;t load your dashboard</h1>
      <p className="mt-2 text-sm text-muted">Something went wrong while fetching your data. Try again.</p>
      <Button className="mt-6" onClick={reset}>Retry</Button>
    </div>
  );
}
