import type { User as ClerkUser } from "@clerk/backend";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getAllowedRoles,
  normalizeRole,
  resolveRole,
  roleHasAnyPermission,
  roleHasPermission,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserModel as DatabaseUser } from "@/generated/prisma/models/User";
import { getServerOrganization } from "@/lib/server-organization";
import { UsersTable } from "./users-table";
import type { DashboardUser } from "./types";

export const dynamic = "force-dynamic";

function metadataString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readMetadataString(user: ClerkUser, key: string): string {
  return (
    metadataString(user.publicMetadata[key]) ||
    metadataString(user.privateMetadata[key]) ||
    metadataString(user.unsafeMetadata[key])
  );
}

function timestampToIso(timestamp: number | null | undefined): string | null {
  return timestamp ? new Date(timestamp).toISOString() : null;
}

function dateToIso(date: Date | null | undefined): string | null {
  return date?.toISOString() ?? null;
}

function getPrimaryEmail(user: ClerkUser): string {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  );
}

function getDisplayNameFallback(user: ClerkUser, email: string): string {
  return user.username ?? email.split("@")[0] ?? "User";
}

function mapClerkUser(user: ClerkUser, dbUser?: DatabaseUser): DashboardUser {
  const email = getPrimaryEmail(user) || dbUser?.email || "";
  const nameFallback = getDisplayNameFallback(user, email);
  const role =
    normalizeRole(dbUser?.role) ??
    normalizeRole(user.publicMetadata.role) ??
    "customer";
  const clerkCreatedAt = timestampToIso(user.createdAt) ?? new Date(0).toISOString();
  const clerkUpdatedAt =
    timestampToIso(user.updatedAt) ?? timestampToIso(user.createdAt) ?? clerkCreatedAt;

  return {
    id: user.id,
    email,
    firstName: user.firstName ?? dbUser?.firstName ?? (user.lastName ? "" : nameFallback),
    lastName: user.lastName ?? dbUser?.lastName ?? "",
    role,
    title: dbUser?.title ?? readMetadataString(user, "title"),
    department: dbUser?.department ?? readMetadataString(user, "department"),
    hospitalId: dbUser?.hospitalId ?? readMetadataString(user, "hospitalId"),
    organizationId: dbUser?.organizationId ?? readMetadataString(user, "organizationId") ?? "",
    avatarUrl: dbUser?.avatarUrl ?? user.imageUrl,
    phone:
      dbUser?.phone ??
      user.primaryPhoneNumber?.phoneNumber ??
      readMetadataString(user, "phone"),
    createdAt: dateToIso(dbUser?.createdAt) ?? clerkCreatedAt,
    updatedAt: dateToIso(dbUser?.updatedAt) ?? clerkUpdatedAt,
    accountStatus: user.banned ? "banned" : user.locked ? "locked" : "active",
    databaseStatus: dbUser ? "linked" : "missing",
    clerkCreatedAt,
    clerkUpdatedAt,
    dbCreatedAt: dateToIso(dbUser?.createdAt),
    dbUpdatedAt: dateToIso(dbUser?.updatedAt),
    lastActiveAt: timestampToIso(user.lastActiveAt),
    lastSignInAt: timestampToIso(user.lastSignInAt),
  };
}

export default async function UsersPage() {
  const signedInUser = await currentUser();

  if (!signedInUser) {
    redirect("/sign-in");
  }

  const signedInDbUser = await prisma.user.findUnique({
    where: { id: signedInUser.id },
  });
  const signedInRole = resolveRole(
    signedInDbUser?.role,
    signedInUser.publicMetadata.role,
  );
  if (!roleHasAnyPermission(signedInRole, ["users:manage-roles", "users:read-org"])) {
    redirect("/dashboard");
  }

  const org = await getServerOrganization();
  const organizationId = org?.organizationId;
  const isSuperadmin = org?.role === "superadmin";
  const orgType = org?.organizationType ?? "hospital";
  const allowedRoles = getAllowedRoles(signedInRole, orgType);
  const canManage = roleHasPermission(signedInRole, "users:manage-roles");

  const client = await clerkClient();
  const clerkUsers = await client.users.getUserList({
    limit: isSuperadmin ? 100 : 250,
    orderBy: "-created_at",
  });

  const dbUsers = await prisma.user.findMany({
    where: isSuperadmin
      ? {
          id: {
            in: clerkUsers.data.map((user) => user.id),
          },
        }
      : {
          organizationId,
          id: {
            in: clerkUsers.data.map((user) => user.id),
          },
        },
  });
  const dbUsersById = new Map(dbUsers.map((user) => [user.id, user]));

  const users = clerkUsers.data
    .map((user) => mapClerkUser(user, dbUsersById.get(user.id)))
    .filter((u) => isSuperadmin || allowedRoles.includes(u.role));

  return (
    <UsersTable
      totalCount={clerkUsers.totalCount ?? clerkUsers.data.length}
      users={users}
      allowedRoles={allowedRoles}
      canManage={canManage}
    />
  );
}
