import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getServerOrganization } from "@/lib/server-organization";
import { resolveRole } from "@/lib/permissions";
import { SeedButton } from "./seed-button";

export const dynamic = "force-dynamic";

export default async function AdminSeedPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  let role: string | null = null;
  try {
    const org = await getServerOrganization();
    if (org?.role) {
      role = org.role;
    }
  } catch {
    // Database may not be seeded yet; fall back to Clerk metadata
  }

  if (!role) {
    role = resolveRole(user.publicMetadata?.role);
  }

  if (role !== "superadmin" && role !== "administrator") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Database Seed</h1>
        <p className="text-sm text-gray-500 mt-1">
          Populate the database with sample and Texas demo data.
        </p>
      </div>
      <SeedButton />
    </div>
  );
}
