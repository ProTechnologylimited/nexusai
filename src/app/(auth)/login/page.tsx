import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const { callbackUrl, reset } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Nexus AI workspace.">
      <LoginForm callbackUrl={callbackUrl} notice={reset ? "Your password was changed. Sign in with the new password." : undefined} />
    </AuthShell>
  );
}
