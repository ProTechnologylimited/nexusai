import { Construction } from "lucide-react";
import { Card } from "@/components/ui/primitives";

/** Honest stand-in for modules scheduled for later phases. Has no fake data or controls. */
export function ModulePlaceholder({ title, description, needs }: { title: string; description: string; needs: string[] }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <Card className="mt-8 p-8">
        <Construction className="size-6 text-warn" aria-hidden="true" />
        <h2 className="mt-4 font-semibold">Not built yet</h2>
        <p className="mt-1 text-sm text-muted">This module is planned for a later build phase. It still needs:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          {needs.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </Card>
    </div>
  );
}
