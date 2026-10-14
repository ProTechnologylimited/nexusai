"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LifeBuoy, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/session";
import { switchWorkspaceAction } from "@/app/actions/team";

export function AppShell({
  user, workspaceName, workspaces = [], activeWorkspaceId, children,
}: { user: { name: string; email: string }; workspaceName: string; workspaces?: { id: string; name: string }[]; activeWorkspaceId?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-dvh lg:pl-64">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink px-3 py-5 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-3">
          <Logo dark />
          <button className="rounded-md p-2 text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Main" className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href} href={href} aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-brand text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4.5" aria-hidden="true" /> {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/support" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <LifeBuoy className="size-4.5" aria-hidden="true" /> Support
        </Link>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 text-ink lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation" aria-controls="sidebar" aria-expanded={open}>
              <Menu className="size-5" />
            </button>
            <span className="text-sm font-medium text-muted">{workspaceName}</span>
          </div>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100" aria-label="Account menu">
              <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{initials}</span>
            </summary>
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              {workspaces.filter((w) => w.id !== activeWorkspaceId).map((w) => (
                <button key={w.id} type="button" onClick={() => switchWorkspaceAction(w.id)} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-slate-50">Switch to {w.name}</button>
              ))}
              <Link href="/settings" className="flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-slate-50">Settings</Link>
              <form action={signOutAction}>
                <button type="submit" className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm hover:bg-slate-50">
                  <LogOut className="size-4" aria-hidden="true" /> Sign out
                </button>
              </form>
            </div>
          </details>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
