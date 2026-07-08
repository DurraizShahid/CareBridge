import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveRole, roleHasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";
import { getHospitals } from "@/lib/data-access";
import { HospitalsTable } from "./hospitals-table";

export const dynamic = "force-dynamic";

export default async function HospitalsPage() {
  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const signedInDbUser = await prisma.user.findUnique({
    where: { id: signedInUser.id },
  });
  const signedInRole = resolveRole(
    signedInDbUser?.role,
    signedInUser.publicMetadata.role,
  );
  if (!roleHasPermission(signedInRole, "hospitals:manage")) {
    redirect("/dashboard");
  }

  const org = await getServerOrganization();
  const organizationId = org?.organizationId;

  if (!organizationId) {
    redirect("/onboarding");
  }

  const hospitals = await getHospitals(organizationId, signedInRole);

  return (
    <HospitalsTable
      hospitals={hospitals}
    />
  );
}
