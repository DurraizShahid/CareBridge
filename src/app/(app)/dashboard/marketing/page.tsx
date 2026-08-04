import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MarketingPostsClient } from "./marketing-posts-client";

export const dynamic = "force-dynamic";

export default async function MarketingPostsPage() {
  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const signedInDbUser = await prisma.user.findUnique({
    where: { id: signedInUser.id },
  });
  const signedInRole = resolveRole(
    signedInDbUser?.role,
    signedInUser.publicMetadata.role,
  );

  if (signedInRole !== "superadmin") {
    redirect("/dashboard");
  }

  return <MarketingPostsClient />;
}
