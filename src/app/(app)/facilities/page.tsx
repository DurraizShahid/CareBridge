import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { FacilityCard } from "@/components/facility-card";

const facilityNames = [
  "Sunrise Senior Living", "Golden Years Nursing", "Pacific Care Center",
  "Mountain View Rehabilitation", "Lakeside Assisted Living", "Harbor View Medical",
  "Cedar Ridge Nursing Home", "Oakwood Senior Care", "Maplewood Rehabilitation",
  "Pinecrest Assisted Living", "Willow Springs Nursing", "Birchwood Senior Center",
  "Elm Court Care Home", "Magnolia Gardens", "Rosewood Medical Center",
  "Cherry Blossom Nursing", "Ivy League Senior Care", "Aspen Ridge Rehabilitation",
  "Sycamore Assisted Living", "Hawthorn Medical Center", "Cypress Point Nursing",
  "Juniper Hill Senior Care", "Laurel Springs Rehabilitation", "Stonegate Assisted Living",
  "Riverside Medical Center", "Brookside Nursing Home", "Meadow View Senior Care",
  "Highland Park Rehabilitation", "Valley Oaks Assisted Living", "Westlake Medical Center",
  "Northpoint Nursing", "Southwind Senior Care", "Eastview Rehabilitation",
  "Westwood Assisted Living", "Clearwater Medical Center", "Greenfield Nursing Home",
  "Blue Harbor Senior Care", "Lakewood Rehabilitation", "Forest Glen Assisted Living",
  "Springdale Medical Center", "Summit View Nursing", "Autumn Leaves Senior Care",
  "Winter Haven Rehabilitation", "Summer Breeze Assisted Living", "Spring Meadow Medical",
  "Coral Springs Nursing", "Sandy Beach Senior Care", "Palm Grove Rehabilitation",
  "Island View Assisted Living", "Coastal Medical Center",
];

const facilityTypes = [
  "Skilled Nursing Facility", "Rehabilitation Center", "Assisted Living",
  "Long-Term Care", "Skilled Nursing Facility", "Rehabilitation Center",
  "Assisted Living", "Skilled Nursing Facility", "Rehabilitation Center",
  "Assisted Living", "Skilled Nursing Facility", "Long-Term Care",
];

const usCities = [
  { city: "New York", state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "Chicago", state: "IL" },
  { city: "Houston", state: "TX" },
  { city: "Phoenix", state: "AZ" },
  { city: "Philadelphia", state: "PA" },
  { city: "San Antonio", state: "TX" },
  { city: "San Diego", state: "CA" },
  { city: "Dallas", state: "TX" },
  { city: "San Jose", state: "CA" },
  { city: "Austin", state: "TX" },
  { city: "Jacksonville", state: "FL" },
  { city: "Fort Worth", state: "TX" },
  { city: "Columbus", state: "OH" },
  { city: "Charlotte", state: "NC" },
  { city: "Indianapolis", state: "IN" },
  { city: "San Francisco", state: "CA" },
  { city: "Seattle", state: "WA" },
  { city: "Denver", state: "CO" },
  { city: "Washington", state: "DC" },
  { city: "Nashville", state: "TN" },
  { city: "Oklahoma City", state: "OK" },
  { city: "El Paso", state: "TX" },
  { city: "Boston", state: "MA" },
  { city: "Portland", state: "OR" },
];

const careLevelOptions = [
  ["Skilled Nursing", "Rehabilitation"],
  ["Assisted Living", "Long-Term Care"],
  ["Skilled Nursing", "Rehabilitation", "Assisted Living"],
  ["Rehabilitation", "Assisted Living"],
  ["Skilled Nursing", "Long-Term Care"],
  ["Assisted Living", "Memory Care"],
  ["Skilled Nursing", "Rehabilitation", "Long-Term Care"],
];

const sourceOptions = ["Website", "LinkedIn"];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateFacilities() {
  return facilityNames.map((name, index) => {
    const rating = 4.2 + seededRandom(index * 7 + 3) * 0.8;
    const occupancyPercent = 53 + Math.floor(seededRandom(index * 11 + 5) * 28);
    const location = usCities[index % usCities.length];
    const type = facilityTypes[index % facilityTypes.length];
    const careLevels = careLevelOptions[index % careLevelOptions.length];
    const hasAvailability = occupancyPercent < 75;
    const source = sourceOptions[index % sourceOptions.length];

    return {
      id: `facility-${index + 1}`,
      name,
      type,
      rating: Math.round(rating * 10) / 10,
      occupancyPercent,
      careLevels,
      city: location.city,
      state: location.state,
      hasAvailability,
      source,
    };
  });
}

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
  const facilities = generateFacilities();

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search facilities by name, type, or location..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Facility Cards - 5 columns */}
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
