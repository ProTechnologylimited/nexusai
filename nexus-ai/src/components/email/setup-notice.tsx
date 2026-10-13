export function SetupNotice({ missing }: { missing: string[] }) {
  if (missing.length === 0) return null;
  return (
    <div role="note" className="rounded-xl border border-warn/40 bg-amber-50 p-4 text-sm">
      <p className="font-medium">Email sending is not set up</p>
      <p className="mt-1 text-muted">You can write and approve drafts, but sending needs these server environment variables: {missing.map((m) => <code key={m} className="mx-0.5 rounded bg-white px-1">{m}</code>)}. Nothing is sent until they are configured.</p>
    </div>
  );
}
