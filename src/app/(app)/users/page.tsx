import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getUsers } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

const roleLabels: Record<string, string> = {
  "social-worker": "Social Worker",
  "discharge-planner": "Discharge Planner",
  administrator: "Administrator",
  "facility-coordinator": "Facility Coordinator",
  superadmin: "Super Admin",
  customer: "Customer",
};

export default async function UsersPage() {
  const org = await getServerOrganization();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const users = await getUsers(organizationId, role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage and view all users in your organization."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-card-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {user.department || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {user.phone || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {users.length} users
      </p>
    </div>
  );
}
