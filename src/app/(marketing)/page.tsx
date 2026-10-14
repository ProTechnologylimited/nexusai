import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { FeatureGrid, HowItWorks, Pricing, Solutions } from "@/components/marketing/sections";
import { buttonClasses } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Nexus AI | AI-powered business automation",
  description: "Discover opportunities, automate repetitive work, manage customer relationships, and scale your business with intelligent AI-powered workflows.",
};

export default function LandingPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-canvas">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium text-brand">Your AI-powered operating system for business growth.</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Run Your Business Smarter with AI.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">Discover opportunities, automate repetitive work, manage customer relationships, and scale your business with intelligent AI-powered workflows.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/register" className={buttonClasses("primary", "px-6")}>Start Free</Link>
              <Link href="/#features" className={buttonClasses("secondary", "px-6")}>Explore the Platform</Link>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-4xl"><DashboardPreview /></div>
        </div>
      </section>
      <FeatureGrid />
      <Solutions />
      <HowItWorks />
      <Pricing />
    </>
  );
}
