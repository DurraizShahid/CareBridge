"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/backend";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAllowedRoles, normalizeRole, resolveRole, roleHasAnyPermission, roleHasPermission } from "@/lib/permissions";
import { getServerOrganization } from "@/lib/server-organization";
import { UserRole as PrismaUserRole } from "@/generated/prisma/enums";
import type { UserRole } from "@/types";
import type { UserActionState, UserFormValues } from "./types";

const APP_ROLE_TO_PRISMA: Record<UserRole, PrismaUserRole> = {
  "social-worker": PrismaUserRole.social_worker,
  "discharge-planner": PrismaUserRole.discharge_planner,
  administrator: PrismaUserRole.administrator,
  "facility-coordinator": PrismaUserRole.facility_coordinator,
  superadmin: PrismaUserRole.superadmin,
  customer: PrismaUserRole.customer,
};

function formValue(formData: FormData, key: keyof UserFormValues): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseUserForm(formData: FormData): UserFormValues {
  const role = normalizeRole(formValue(formData, "role"));

  return {
    id: formValue(formData, "id") || undefined,
    email: formValue(formData, "email").toLowerCase(),
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    role: role ?? "customer",
    title: formValue(formData, "title"),
    department: formValue(formData, "department"),
    hospitalId: formValue(formData, "hospitalId"),
    phone: formValue(formData, "phone"),
  };
}

function validateUserForm(values: UserFormValues): string | null {
  if (!values.email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return "Enter a valid email address.";
  }
  if (!values.firstName) return "First name is required.";
  if (!values.lastName) return "Last name is required.";
  return null;
}

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

function getPrimaryEmail(user: ClerkUser): string {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  ).toLowerCase();
}

function getNameFallback(user: ClerkUser, email: string): string {
  return user.username ?? email.split("@")[0] ?? "User";
}

async function requireUserManager() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [clerkUser, dbUser] = await Promise.all([
    (await clerkClient()).users.getUser(userId),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  const role = resolveRole(dbUser?.role, clerkUser.publicMetadata.role);

  if (!roleHasPermission(role, "users:manage-roles")) {
    throw new Error("Forbidden");
  }

  return { userId };
}

/**
 * Auth guard for org-scoped user read/create.
 * Allows users with `users:manage-roles` (superadmin) OR `users:read-org` (admin, facility-coordinator).
 * Returns the authenticated user ID, resolved role, and org context.
 */
async function requireOrgUserReader() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [clerkUser, dbUser] = await Promise.all([
    (await clerkClient()).users.getUser(userId),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  const role = resolveRole(dbUser?.role, clerkUser.publicMetadata.role);

  if (!roleHasAnyPermission(role, ["users:manage-roles", "users:read-org"])) {
    throw new Error("Forbidden");
  }

  const org = await getServerOrganization();
  if (!org) throw new Error("No organization context");

  return {
    userId,
    role,
    organizationId: org.organizationId,
    orgType: org.organizationType,
  };
}

async function findConflictingDbEmail(email: string, currentUserId?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.id === currentUserId) return null;
  return user;
}

function toDbUserData(values: UserFormValues, avatarUrl: string | null | undefined) {
  return {
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    role: APP_ROLE_TO_PRISMA[values.role],
    title: values.title,
    department: values.department,
    hospitalId: values.hospitalId,
    phone: values.phone,
    avatarUrl: avatarUrl ?? null,
  };
}

function clerkUserToFormValues(user: ClerkUser): UserFormValues {
  const email = getPrimaryEmail(user);
  const fallback = getNameFallback(user, email);

  return {
    id: user.id,
    email,
    firstName: user.firstName ?? (user.lastName ? "" : fallback),
    lastName: user.lastName ?? "",
    role: normalizeRole(user.publicMetadata.role) ?? "customer",
    title: readMetadataString(user, "title"),
    department: readMetadataString(user, "department"),
    hospitalId: readMetadataString(user, "hospitalId"),
    phone:
      user.primaryPhoneNumber?.phoneNumber ?? readMetadataString(user, "phone"),
  };
}

export async function createUserAction(
  formData: FormData,
): Promise<UserActionState> {
  try {
    const { organizationId, orgType, role: currentRole } = await requireOrgUserReader();

    const values = parseUserForm(formData);
    const error = validateUserForm(values);
    if (error) return { status: "error", message: error };

    // Validate the target role is allowed for this org type
    const allowedRoles = getAllowedRoles(currentRole, orgType);
    if (!allowedRoles.includes(values.role)) {
      return {
        status: "error",
        message: `Cannot assign role "${values.role}" to a user in a ${orgType} organization.`,
      };
    }

    const existingDbEmail = await findConflictingDbEmail(values.email);
    if (existingDbEmail) {
      return {
        status: "error",
        message: "That email is already assigned to another database user.",
      };
    }

    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      emailAddress: [values.email],
      firstName: values.firstName,
      lastName: values.lastName,
      publicMetadata: { role: values.role },
      skipPasswordRequirement: true,
    });

    await prisma.user.create({
      data: {
        id: clerkUser.id,
        ...toDbUserData(values, clerkUser.imageUrl),
        organization: { connect: { id: organizationId } },
      },
    });

    revalidatePath("/dashboard/users");
    return { status: "success", message: "User created." };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not create user.",
    };
  }
}

export async function updateUserAction(
  formData: FormData,
): Promise<UserActionState> {
  try {
    await requireUserManager();

    const values = parseUserForm(formData);
    if (!values.id) return { status: "error", message: "User ID is missing." };

    const error = validateUserForm(values);
    if (error) return { status: "error", message: error };

    const existingDbEmail = await findConflictingDbEmail(
      values.email,
      values.id,
    );
    if (existingDbEmail) {
      return {
        status: "error",
        message: "That email is already assigned to another database user.",
      };
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(values.id);
    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress ?? "";

    await Promise.all([
      client.users.updateUser(values.id, {
        firstName: values.firstName,
        lastName: values.lastName,
      }),
      client.users.updateUserMetadata(values.id, {
        publicMetadata: { role: values.role },
      }),
      primaryEmail && primaryEmail.toLowerCase() !== values.email
        ? client.users.replaceUserEmailAddress(values.id, {
            emailAddress: values.email,
          })
        : Promise.resolve(null),
    ]);

    const org = await getServerOrganization();
    const organizationId = org?.organizationId ?? "org-001";

    await prisma.user.upsert({
      where: { id: values.id },
      update: toDbUserData(values, clerkUser.imageUrl),
      create: {
        id: values.id,
        ...toDbUserData(values, clerkUser.imageUrl),
        organization: { connect: { id: organizationId } },
      },
    });

    revalidatePath("/dashboard/users");
    return { status: "success", message: "User updated." };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not update user.",
    };
  }
}

export async function syncUserProfileAction(
  userId: string,
): Promise<UserActionState> {
  try {
    await requireUserManager();
    if (!userId) return { status: "error", message: "User ID is missing." };

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const values = clerkUserToFormValues(clerkUser);

    const org = await getServerOrganization();
    const organizationId = org?.organizationId ?? "org-001";

    await prisma.user.upsert({
      where: { id: userId },
      update: toDbUserData(values, clerkUser.imageUrl),
      create: {
        id: userId,
        ...toDbUserData(values, clerkUser.imageUrl),
        organization: { connect: { id: organizationId } },
      },
    });

    revalidatePath("/dashboard/users");
    return { status: "success", message: "Railway profile synced." };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not sync profile.",
    };
  }
}

export async function setUserAccessAction(
  userId: string,
  access: "ban" | "unban",
): Promise<UserActionState> {
  try {
    const manager = await requireUserManager();
    if (!userId) return { status: "error", message: "User ID is missing." };
    if (userId === manager.userId) {
      return {
        status: "error",
        message: "You cannot change your own sign-in access here.",
      };
    }

    const client = await clerkClient();
    if (access === "ban") await client.users.banUser(userId);
    else await client.users.unbanUser(userId);

    revalidatePath("/dashboard/users");
    return {
      status: "success",
      message: access === "ban" ? "User disabled." : "User enabled.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not update sign-in access.",
    };
  }
}
