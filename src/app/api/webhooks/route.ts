import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole as UserRoleEnum } from "@/generated/prisma/enums";
import type { UserRole } from "@/generated/prisma/enums";
import { kebabToPrismaRole, normalizeOrganizationType } from "@/lib/organization-role";

// ── Retry for transient DB errors ──

const TRANSIENT_PRISMA_CODES = ["P1001", "P1008", "P1017", "P2024", "P2030"];

function isTransientError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return TRANSIENT_PRISMA_CODES.includes((err as { code: string }).code);
  }
  return false;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_ATTEMPTS = 3;
  const BASE_DELAY_MS = 200;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS && isTransientError(err)) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          { event: "webhook_retry", attempt, maxAttempts: MAX_ATTEMPTS, delayMs: delay, errorCode: (err as { code?: string }).code },
          `transient error, retrying in ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

// ── Helpers ──

function resolveRole(metadata: Record<string, unknown> | undefined): UserRole | null {
  if (metadata?.role && typeof metadata.role === "string") {
    return kebabToPrismaRole(metadata.role);
  }
  return null;
}

function resolveOrganizationId(metadata: Record<string, unknown> | undefined): string | null {
  if (metadata?.organizationId && typeof metadata.organizationId === "string") {
    return metadata.organizationId;
  }
  return null;
}

type ClerkUserData = {
  id: string;
  email_addresses?: { email_address: string }[];
  first_name?: string;
  last_name?: string;
  image_url?: string;
  public_metadata?: Record<string, unknown>;
};

type ClerkOrganizationData = {
  id: string;
  name: string;
  slug: string;
  public_metadata?: Record<string, unknown>;
};

// ── Prisma upsert helpers (share duplicative shapes) ──

async function upsertUser(data: ClerkUserData, existingUser: { role: UserRole; organizationId: string | null } | null) {
  const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data;
  const email = email_addresses?.[0]?.email_address ?? "unknown@email.com";
  const role = resolveRole(public_metadata) ?? existingUser?.role ?? UserRoleEnum.customer;
  const orgId = resolveOrganizationId(public_metadata) ?? existingUser?.organizationId ?? null;

  await prisma.user.upsert({
    where: { id },
    update: {
      email,
      firstName: first_name ?? "",
      lastName: last_name ?? "",
      role,
      avatarUrl: image_url,
      ...(orgId ? { organizationId: orgId } : {}),
    },
    create: {
      id,
      email,
      firstName: first_name ?? "",
      lastName: last_name ?? "",
      role,
      title: "",
      department: "",
      hospitalId: "",
      phone: "",
      avatarUrl: image_url,
      ...(orgId ? { organizationId: orgId } : {}),
    },
  });

  return { email, role, orgId };
}

async function upsertOrganization(data: ClerkOrganizationData) {
  const { id, name, slug, public_metadata } = data;
  const orgType = normalizeOrganizationType(public_metadata?.type) ?? "hospital";

  await prisma.organization.upsert({
    where: { id },
    update: { name, slug },
    create: { id, name, slug, type: orgType },
  });

  return { name, orgType };
}

// ── Webhook POST handler ──

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error({ event: "webhook_verify_failed", error: String(err) }, "webhook verification failed");
    return new Response("Verification failed", { status: 400 });
  }

  if (!evt.data) {
    console.warn({ event: "webhook_no_data", type: evt.type }, "webhook missing data");
    return new Response("OK", { status: 200 });
  }

  const eventId = crypto.randomUUID();

  try {
    switch (evt.type) {
      case "user.created": {
        const data = evt.data as ClerkUserData;
        const existingUser = await withRetry(() => prisma.user.findUnique({ where: { id: data.id } }));
        const { email, role } = await withRetry(() => upsertUser(data, existingUser));
        console.log({ event: "webhook_user_created", eventId, userId: data.id, email, role }, `user.created: ${email}`);
        break;
      }

      case "user.updated": {
        const data = evt.data as ClerkUserData;
        const existingUser = await withRetry(() => prisma.user.findUnique({ where: { id: data.id } }));
        const { email, role } = await withRetry(() => upsertUser(data, existingUser));
        console.log({ event: "webhook_user_updated", eventId, userId: data.id, email, role }, `user.updated: ${email}`);
        break;
      }

      case "user.deleted": {
        const data = evt.data as ClerkUserData;
        await withRetry(() => prisma.user.delete({ where: { id: data.id } }));
        console.log({ event: "webhook_user_deleted", eventId, userId: data.id }, `user.deleted: ${data.id}`);
        break;
      }

      case "organization.created": {
        const data = evt.data as ClerkOrganizationData;
        const { name, orgType } = await withRetry(() => upsertOrganization(data));
        console.log({ event: "webhook_org_created", eventId, orgId: data.id, name, orgType }, `org.created: ${name}`);
        break;
      }

      case "organization.updated": {
        const data = evt.data as ClerkOrganizationData;
        const { name, orgType } = await withRetry(() => upsertOrganization(data));
        console.log({ event: "webhook_org_updated", eventId, orgId: data.id, name, orgType }, `org.updated: ${name}`);
        break;
      }

      case "organization.deleted": {
        const data = evt.data as { id: string };
        await withRetry(() =>
          prisma.$transaction([
            prisma.user.updateMany({ where: { organizationId: data.id }, data: { organizationId: null } }),
            prisma.organization.delete({ where: { id: data.id } }),
          ]),
        );
        console.log({ event: "webhook_org_deleted", eventId, orgId: data.id }, `org.deleted: ${data.id}`);
        break;
      }

      default: {
        console.log({ event: "webhook_unhandled", eventId, type: evt.type }, `unhandled: ${evt.type}`);
      }
    }
  } catch (err) {
    const errorInfo = err instanceof Error ? { message: err.message, name: err.name } : { message: String(err) };
    console.error({ event: "webhook_handler_failed", eventId, type: evt.type, error: errorInfo }, `handler failed: ${evt.type}`);
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
