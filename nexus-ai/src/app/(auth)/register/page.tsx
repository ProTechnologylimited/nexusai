import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Set up your Nexus AI workspace in a few minutes.">
      <RegisterForm />
    </AuthShell>
  );
}
