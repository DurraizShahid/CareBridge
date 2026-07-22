import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { getFacilities } from "@/lib/data-access";
import { FacilityCard } from "@/components/facility-card";

export default async function FacilitiesPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Admin");
  if (!roleHasPermission(role, "facilities:read")) redirect("/dashboard");
  const canCreate = roleHasPermission(role, "facilities:create");
  const facilities = await getFacilities(organizationId, role);

  return (
    <div className="-mx-4 -my-10 sm:-mx-6 lg:-mx-8 px-4 py-10 sm:px-6 lg:px-8 bg-muted/30 min-h-full space-y-6">
      <PageHeader
        title=""
        description="Browse and discover care settings for your patients."
        userName={userName}
        welcomePrefix="Explore"
        welcomeName="Facilities"
        breadcrumbs={[{ label: "Facilities" }]}
      >
        {canCreate && (
          <Button variant="default" render={<Link href="/facilities/new" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Facility
          </Button>
        )}
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search facilities by name, type, or location..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-lg font-semibold text-foreground">New Facilities</h2>
        <Link href="/facilities" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {facilities.length} facilities
      </p>
    </div>
  );
}
