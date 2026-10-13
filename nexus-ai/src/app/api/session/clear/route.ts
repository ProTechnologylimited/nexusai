import { signOut } from "@/lib/auth";

// Used when a valid session token points to a user/workspace that no longer exists.
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
