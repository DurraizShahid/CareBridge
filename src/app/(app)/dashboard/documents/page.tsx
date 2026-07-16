import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission, resolveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DocumentsPageClient } from "./documents-page-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");

  const signedInDbUser = await prisma.user.findUnique({
    where: { id: signedInUser.id },
  });
  const signedInRole = resolveRole(
    signedInDbUser?.role,
    signedInUser.publicMetadata.role,
  );
  if (!roleHasPermission(signedInRole, "documents:read")) {
    redirect("/dashboard");
  }

  const canUpload = roleHasPermission(signedInRole, "documents:create");
  const canDelete = roleHasPermission(signedInRole, "documents:delete");
  const canAudit = roleHasPermission(signedInRole, "documents:audit");

  return (
    <DocumentsPageClient
      organizationId={org.organizationId}
      canUpload={canUpload}
      canDelete={canDelete}
      canAudit={canAudit}
    />
  );
}
