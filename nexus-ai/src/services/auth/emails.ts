// Pure builders for account emails.
export const appLink = (base: string, path: string, token: string) => `${base.replace(/\/$/, "")}${path}?token=${encodeURIComponent(token)}`;

export const resetEmail = (url: string) => ({
  subject: "Reset your Nexus AI password",
  text: `Someone asked to reset the password for your Nexus AI account.\n\nUse this link within 1 hour:\n${url}\n\nIf you didn't ask for this, you can ignore this email. Your password will not change.`,
});

export const verifyEmail = (url: string, name: string) => ({
  subject: "Verify your email for Nexus AI",
  text: `Hi ${name.split(" ")[0] || "there"},\n\nConfirm your email address to finish setting up Nexus AI. The link works for 24 hours:\n${url}\n\nIf you didn't create an account, you can ignore this email.`,
});
