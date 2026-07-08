"use server";

import { clerkClient } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/backend";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAllowedRoles, normalizeRole } from "@/lib/permissions";
import { appRoleToPrismaRole } from "@/lib/organization-role";
import { requireOrgPermission } from "@/lib/server-auth";
import type { UserRole } from "@/types";
import type { UserActionState, UserFormValues } from "./types";

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
  return requireOrgPermission("users:manage-roles");
}

async function requireOrgUserCreator() {
  const { userId, org } = await requireOrgPermission("users:create");

  return {
    userId,
    role: org.role,
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
    role: appRoleToPrismaRole(values.role),
    title: values.title,
    department: values.department,
    hospitalId: values.hospitalId,
    phone: values.phone,
    avatarUrl: avatarUrl ?? null,
  };
}

function userPublicMetadata(
  values: UserFormValues,
  organizationId: string,
  organizationType: "hospital" | "facility",
) {
  return {
    role: values.role,
    organizationId,
    organizationType,
    title: values.title,
    department: values.department,
    hospitalId: values.hospitalId,
    phone: values.phone,
  };
}

function targetRoleIsAllowed(
  values: UserFormValues,
  currentRole: UserRole,
  orgType: "hospital" | "facility",
) {
  return getAllowedRoles(currentRole, orgType).includes(values.role);
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
    const { organizationId, orgType, role: currentRole } = await requireOrgUserCreator();

    const values = parseUserForm(formData);
    const error = validateUserForm(values);
    if (error) return { status: "error", message: error };

    if (!targetRoleIsAllowed(values, currentRole, orgType)) {
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
      publicMetadata: userPublicMetadata(values, organizationId, orgType),
      skipPasswordRequirement: true,
    });

    await prisma.user.upsert({
      where: { id: clerkUser.id },
      update: {
        ...toDbUserData(values, clerkUser.imageUrl),
        organization: { connect: { id: organizationId } },
      },
      create: {
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
    const { org } = await requireUserManager();

    const values = parseUserForm(formData);
    if (!values.id) return { status: "error", message: "User ID is missing." };

    const error = validateUserForm(values);
    if (error) return { status: "error", message: error };

    if (!targetRoleIsAllowed(values, org.role, org.organizationType)) {
      return {
        status: "error",
        message: `Cannot assign role "${values.role}" to a user in a ${org.organizationType} organization.`,
      };
    }

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
    const existingDbUser = await prisma.user.findUnique({
      where: { id: values.id },
    });

    if (
      !org.isSuperadmin &&
      existingDbUser?.organizationId &&
      existingDbUser.organizationId !== org.organizationId
    ) {
      return { status: "error", message: "Forbidden" };
    }

    const organizationId = existingDbUser?.organizationId ?? org.organizationId;

    await Promise.all([
      client.users.updateUser(values.id, {
        firstName: values.firstName,
        lastName: values.lastName,
      }),
      client.users.updateUserMetadata(values.id, {
        publicMetadata: userPublicMetadata(
          values,
          organizationId,
          org.organizationType,
        ),
      }),
      primaryEmail && primaryEmail.toLowerCase() !== values.email
        ? client.users.replaceUserEmailAddress(values.id, {
            emailAddress: values.email,
          })
        : Promise.resolve(null),
    ]);

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
    const { org } = await requireUserManager();
    if (!userId) return { status: "error", message: "User ID is missing." };

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const values = clerkUserToFormValues(clerkUser);
    const existingDbUser = await prisma.user.findUnique({ where: { id: userId } });
    const metadataOrgId = readMetadataString(clerkUser, "organizationId");

    if (
      !org.isSuperadmin &&
      existingDbUser?.organizationId !== org.organizationId &&
      metadataOrgId !== org.organizationId
    ) {
      return { status: "error", message: "Forbidden" };
    }

    if (!targetRoleIsAllowed(values, org.role, org.organizationType)) {
      return {
        status: "error",
        message: `Cannot assign role "${values.role}" to a user in a ${org.organizationType} organization.`,
      };
    }

    const organizationId =
      existingDbUser?.organizationId ?? (metadataOrgId || org.organizationId);

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
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (
      !manager.org.isSuperadmin &&
      targetUser?.organizationId !== manager.org.organizationId
    ) {
      return { status: "error", message: "Forbidden" };
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
