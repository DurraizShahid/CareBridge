import { Search, MapPin, Phone, Star, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { getFacilities } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "skilled_nursing_facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "rehabilitation_center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "assisted_living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "long_term_care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  "home_health_agency": "Home Health Agency",
  hospice: "Hospice",
};

export default async function FacilitiesPage() {
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";
  const facilities = await getFacilities(organizationId, role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description="Browse and discover care settings for your patients."
      >
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted active:translate-y-px"
        >
          <Building2 className="h-4 w-4" />
          Filter
        </button>
      </PageHeader>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search facilities by name, type, or location..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Facility Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="group flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
          >
            {/* Card header */}
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-base font-bold text-card-foreground">
                  {facility.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {facilityTypeLabels[facility.type] ?? facility.type}
                </p>
              </div>
              <div
              className={cn(
                "flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
                facility.hasAvailability
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  facility.hasAvailability ? "bg-green-500" : "bg-red-500",
                )}
              />
              {facility.hasAvailability ? "Available" : "Full"}
            </div>
            </div>

            {/* Card body */}
            <div className="flex-1 space-y-3 px-5 py-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {facility.address.city}, {facility.address.state}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{facility.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  {facility.rating} ({facility.reviewsCount} reviews)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {facility.careLevelsOffered.slice(0, 3).map((level) => (
                  <span
                    key={level}
                    className="inline-flex rounded-full bg-health/10 px-2 py-0.5 text-xs text-health"
                  >
                    {level.replace("-", " ").replace("_", " ")}
                  </span>
                ))}
                {facility.careLevelsOffered.length > 3 && (
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    +{facility.careLevelsOffered.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <span className="text-xs text-muted-foreground">
                {facility.currentOccupancy}/{facility.capacity} beds filled
              </span>
              {facility.waitlistDays && (
                <span className="text-xs text-muted-foreground">
                  ~{facility.waitlistDays}d waitlist
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {facilities.length} facilities
      </p>
    </div>
  );
}
