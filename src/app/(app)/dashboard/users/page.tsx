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
// Import invite codes tab component with proper casing to match actual file name
import { InviteCodesTab } from "./invite-codes-tab";
import { JoinRequestsTab } from "./join-requests-tab";
import type { DashboardUser } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

type ClerkBackendClient = Awaited<ReturnType<typeof clerkClient>>;

type LoadedClerkUsers = {
  data: ClerkUser[];
  totalCount: number;
};

const CLERK_PAGE_SIZE = 100;

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

function chunkIds(ids: string[], size = CLERK_PAGE_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

async function getAllClerkUsers(
  client: ClerkBackendClient,
): Promise<LoadedClerkUsers> {
  const users: ClerkUser[] = [];
  let offset = 0;
  let totalCount = 0;

  while (true) {
    const page = await client.users.getUserList({
      limit: CLERK_PAGE_SIZE,
      offset,
      orderBy: "-created_at",
    });

    users.push(...page.data);
    totalCount = page.totalCount ?? users.length;

    if (page.data.length === 0 || users.length >= totalCount) break;
    offset += CLERK_PAGE_SIZE;
  }

  return { data: users, totalCount };
}

async function getClerkUsersByIds(
  client: ClerkBackendClient,
  userIds: string[],
): Promise<LoadedClerkUsers> {
  if (userIds.length === 0) return { data: [], totalCount: 0 };

  const pages = await Promise.all(
    chunkIds(userIds).map((chunk) =>
      client.users.getUserList({
        userId: chunk,
        limit: chunk.length,
      }),
    ),
  );
  const users = pages
    .flatMap((page) => page.data)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return { data: users, totalCount: users.length };
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
  const canCreate = roleHasPermission(signedInRole, "users:create");

  if (!organizationId) {
    redirect("/onboarding");
  }

  const client = await clerkClient();

  const dbUsers = await prisma.user.findMany({
    where: isSuperadmin ? {} : { organizationId },
  });
  const dbUsersById = new Map(dbUsers.map((user) => [user.id, user]));
  const clerkUsers = isSuperadmin
    ? await getAllClerkUsers(client)
    : await getClerkUsersByIds(
        client,
        dbUsers.map((user) => user.id),
      );

  const users = clerkUsers.data
    .map((user) => mapClerkUser(user, dbUsersById.get(user.id)))
    .filter((u) => isSuperadmin || allowedRoles.includes(u.role));

  // Fetch invite codes and join requests
  const inviteCodes = organizationId
    ? await prisma.inviteCode.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: { createdBy: true },
      })
    : [];

  const joinRequests = organizationId
    ? await prisma.joinRequest.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: { user: true, inviteCode: true, reviewedBy: true },
      })
    : [];

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="invite-codes">Invite Codes</TabsTrigger>
        <TabsTrigger value="join-requests">Join Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UsersTable
          totalCount={clerkUsers.totalCount ?? clerkUsers.data.length}
          users={users}
          allowedRoles={allowedRoles}
          canManage={canManage}
          canCreate={canCreate}
        />
      </TabsContent>
      <TabsContent value="invite-codes">
        <InviteCodesTab
          inviteCodes={inviteCodes}
          allowedRoles={allowedRoles}
          canCreate={canCreate}
        />
      </TabsContent>
      <TabsContent value="join-requests">
        <JoinRequestsTab joinRequests={joinRequests} canCreate={canCreate} />
      </TabsContent>
    </Tabs>
  );
}
