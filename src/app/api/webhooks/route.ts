import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole as UserRoleEnum } from "@/generated/prisma/enums";
import type { UserRole } from "@/generated/prisma/enums";
import { normalizeOrganizationType } from "@/lib/organization-role";

/**
 * Maps kebab-case role strings (from Clerk public_metadata)
 * to Prisma's UserRole enum values (snake_case).
 */
function resolveRole(metadata: Record<string, unknown> | undefined): UserRole | null {
  if (metadata?.role && typeof metadata.role === "string") {
    const mapping: Record<string, UserRole> = {
      "social-worker": UserRoleEnum.social_worker,
      "discharge-planner": UserRoleEnum.discharge_planner,
      administrator: UserRoleEnum.administrator,
      "facility-coordinator": UserRoleEnum.facility_coordinator,
      superadmin: UserRoleEnum.superadmin,
      customer: UserRoleEnum.customer,
    };
    return mapping[metadata.role] ?? null;
  }
  return null;
}

function resolveOrganizationId(metadata: Record<string, unknown> | undefined): string | null {
  if (metadata?.organizationId && typeof metadata.organizationId === "string") {
    return metadata.organizationId;
  }
  return null; // Don't auto-assign org for new users - let them go through onboarding
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

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  if (!evt.data) {
    console.warn(`⚠️ Webhook: ${evt.type} — missing data, skipping`);
    return new Response("OK", { status: 200 });
  }

  try {
    switch (evt.type) {
      // ── User Events ──
      case "user.created": {
        try {
          const data = evt.data as ClerkUserData;
          const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data;
          const email = email_addresses?.[0]?.email_address ?? "unknown@email.com";
          const existingUser = await prisma.user.findUnique({ where: { id } });
          const role = resolveRole(public_metadata) ?? existingUser?.role ?? UserRoleEnum.customer;
          const orgId = resolveOrganizationId(public_metadata) ?? existingUser?.organizationId ?? null;
          const createData = {
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
            ...(orgId ? { organization: { connect: { id: orgId } } } : {}),
          };

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
            create: createData,
          });
          console.log(`✅ Webhook: user.created — ${email} (${role})`);
        } catch (err) {
          console.error(`❌ Webhook: user.created failed:`, err);
        }
        break;
      }

      case "user.updated": {
        try {
          const data = evt.data as ClerkUserData;
          const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data;
          const email = email_addresses?.[0]?.email_address ?? "unknown@email.com";
          const existingUser = await prisma.user.findUnique({ where: { id } });
          const role = resolveRole(public_metadata) ?? existingUser?.role ?? UserRoleEnum.customer;
          const orgId = resolveOrganizationId(public_metadata) ?? existingUser?.organizationId ?? null;
          const createData = {
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
            ...(orgId ? { organization: { connect: { id: orgId } } } : {}),
          };

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
            create: createData,
          });
          console.log(`✅ Webhook: user.updated — ${email} (${role})`);
        } catch (err) {
          console.error(`❌ Webhook: user.updated failed:`, err);
        }
        break;
      }

      case "user.deleted": {
        try {
          const data = evt.data as ClerkUserData;
          const { id } = data;
          await prisma.user.delete({ where: { id } });
          console.log(`✅ Webhook: user.deleted — ${id}`);
        } catch {
          console.log(`ℹ️  Webhook: user.deleted — not in DB, skipping`);
        }
        break;
      }

      // ── Organization Events ──
      case "organization.created": {
        try {
          const data = evt.data as ClerkOrganizationData;
          const { id, name, slug, public_metadata } = data;
          const orgType = normalizeOrganizationType(public_metadata?.type) ?? "hospital";
          await prisma.organization.upsert({
            where: { id },
            update: { name, slug },
            create: { id, name, slug, type: orgType },
          });
          console.log(`✅ Webhook: organization.created — ${name}`);
        } catch (err) {
          console.error(`❌ Webhook: organization.created failed:`, err);
        }
        break;
      }

      case "organization.updated": {
        try {
          const data = evt.data as ClerkOrganizationData;
          const { id, name, slug } = data;
          await prisma.organization.upsert({
            where: { id },
            update: { name, slug },
            create: { id, name, slug, type: "hospital" },
          });
          console.log(`✅ Webhook: organization.updated — ${name}`);
        } catch (err) {
          console.error(`❌ Webhook: organization.updated failed:`, err);
        }
        break;
      }

      case "organization.deleted": {
        try {
          const data = evt.data as { id: string };
          const { id } = data;
          await prisma.organization.delete({ where: { id } });
          console.log(`✅ Webhook: organization.deleted — ${id}`);
        } catch {
          console.log(`ℹ️  Webhook: organization.deleted — not in DB, skipping`);
        }
        break;
      }

      default: {
        console.log(`ℹ️  Webhook: unhandled event type — ${evt.type}`);
      }
    }
  } catch (err) {
    console.error(`❌ Webhook: unexpected error processing ${evt.type}:`, err);
  }

  return new Response("OK", { status: 200 });
}
