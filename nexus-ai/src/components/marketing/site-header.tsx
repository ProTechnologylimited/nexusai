import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/primitives";
import { auth } from "@/lib/auth";

const LINKS = [["/#features", "Features"], ["/#solutions", "Solutions"], ["/#pricing", "Pricing"], ["/help", "Resources"]] as const;

export async function SiteHeader() {
  const signedIn = !!(await auth())?.user;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Nexus AI home"><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map(([href, label]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? <Link href="/dashboard" className={buttonClasses("primary")}>Dashboard</Link> : (
            <>
              <Link href="/login" className={buttonClasses("ghost")}>Sign in</Link>
              <Link href="/register" className={buttonClasses("primary")}>Get started</Link>
            </>
          )}
        </div>
        <details className="relative md:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg hover:bg-slate-100" aria-label="Open menu"><Menu className="size-5" /></summary>
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white p-2 shadow-lg">
            {LINKS.map(([href, label]) => <Link key={href} href={href} className="flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-slate-50">{label}</Link>)}
            <hr className="my-1 border-line" />
            {signedIn ? <Link href="/dashboard" className="flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-brand">Dashboard</Link> : (
              <>
                <Link href="/login" className="flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-slate-50">Sign in</Link>
                <Link href="/register" className="flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-brand">Get started</Link>
              </>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
