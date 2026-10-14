import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SITE } from "@/config/site";

const COLUMNS = [
  { title: "Product", links: [["/#features", "Features"], ["/#pricing", "Pricing"], ["/#how-it-works", "How it works"]] },
  { title: "Resources", links: [["/help", "Help Center"], ["/contact", "Contact"]] },
  { title: "Legal", links: [["/privacy", "Privacy Policy"], ["/terms", "Terms of Service"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">{SITE.positioning}</p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => <li key={href}><Link href={href} className="text-muted hover:text-ink">{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">&copy; {new Date().getFullYear()} {SITE.company}. {SITE.name} is a product of {SITE.company}.</div>
    </footer>
  );
}
