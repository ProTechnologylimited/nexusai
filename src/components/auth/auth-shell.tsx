import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" aria-label="Nexus AI home"><Logo /></Link>
          <h1 className="mt-10 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-ink lg:block" aria-hidden="true">
        <svg viewBox="0 0 600 800" className="absolute inset-0 size-full opacity-60" preserveAspectRatio="xMidYMid slice">
          <g stroke="#6366F1" strokeWidth="1.2" fill="none" opacity="0.7">
            <path d="M120 180 300 320 480 200M300 320 220 520 420 600M220 520 120 680M420 600 500 720M300 320 420 600" />
          </g>
          <g fill="#3B82F6">
            {[[120,180],[300,320],[480,200],[220,520],[420,600],[120,680],[500,720]].map(([x,y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />
            ))}
          </g>
        </svg>
        <div className="relative flex h-full flex-col justify-end p-14">
          <p className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white">
            Your AI-powered operating system for business growth.
          </p>
          <p className="mt-3 text-sm text-slate-400">Find opportunities. Automate operations. Grow intelligently.</p>
        </div>
      </aside>
    </main>
  );
}
