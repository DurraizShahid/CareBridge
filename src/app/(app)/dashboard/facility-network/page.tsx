import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";
import { FacilityNetworkClient } from "./facility-network-client";

export const dynamic = "force-dynamic";

export default async function FacilityNetworkPage() {
  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");
  if (org.role === "facility-coordinator") redirect("/dashboard");

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

  return <FacilityNetworkClient defaultLocation={defaultLocation} />;
}
