import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";
import { getRecommendedFacilityIds } from "@/lib/recommended-facilities";
import { searchFacilities } from "@/lib/data-access";
import { FacilityNetworkClient } from "./facility-network-client";

export const dynamic = "force-dynamic";

export default async function FacilityNetworkPage() {
  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");
  const recommendationsOnly = org.organizationType === "hospital" && !org.isSuperadmin;

  let defaultLocation = "";

  const signedInDbUser = await prisma.user.findUnique({
    where: { id: signedInUser.id },
  });

  if (signedInDbUser?.hospitalId) {
    const hospital = await prisma.hospital.findUnique({
      where: { id: signedInDbUser.hospitalId },
    });
    if (hospital) {
      const addr = hospital.address as {
        city?: string;
        state?: string;
      };
      defaultLocation = [addr.city, addr.state]
        .filter(Boolean)
        .join(", ");
    }
  }

  const initialResult = await searchFacilities({
    location: recommendationsOnly ? undefined : defaultLocation || undefined,
    facilityIds: recommendationsOnly ? [...await getRecommendedFacilityIds(org.organizationId)] : undefined,
  });
  const initialFacilities = Array.isArray(initialResult) ? initialResult : initialResult.facilities;
  const initialTotal = Array.isArray(initialResult) ? initialResult.length : initialResult.total;

  const userName = signedInUser.firstName
    ? signedInUser.firstName.charAt(0).toUpperCase() + signedInUser.firstName.slice(1)
    : (signedInUser.username ?? "Staff");

  return (
    <FacilityNetworkClient
      defaultLocation={recommendationsOnly ? "" : defaultLocation}
      recommendationsOnly={recommendationsOnly}
      role={org.role}
      userName={userName}
      initialFacilities={initialFacilities}
      initialTotal={initialTotal}
    />
  );
}
