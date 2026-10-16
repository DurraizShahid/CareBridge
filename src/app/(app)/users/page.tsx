import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/ui/page-header";
import { getUsers } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { UsersDirectoryClient } from "./users-directory-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Admin");
  const users = await getUsers(organizationId, role);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Team Directory"
        description="Manage organization staff, role assignments, department associations, and contact details."
        userName={userName}
        welcomePrefix="Manage"
        welcomeName="Team"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users" },
        ]}
      />

      <UsersDirectoryClient users={users} />
    </div>
  );
}
