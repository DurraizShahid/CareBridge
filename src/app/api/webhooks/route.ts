import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole as UserRoleEnum } from "@/generated/prisma/enums";
import type { UserRole } from "@/generated/prisma/enums";

/**
 * Maps kebab-case role strings (from Clerk public_metadata)
 * to Prisma's UserRole enum values (snake_case).
 */
function resolveRole(metadata: Record<string, unknown> | undefined): UserRole {
  if (metadata?.role && typeof metadata.role === "string") {
    const mapping: Record<string, UserRole> = {
      "social-worker": UserRoleEnum.social_worker,
      "discharge-planner": UserRoleEnum.discharge_planner,
      administrator: UserRoleEnum.administrator,
      "facility-coordinator": UserRoleEnum.facility_coordinator,
      superadmin: UserRoleEnum.superadmin,
      customer: UserRoleEnum.customer,
    };
    return mapping[metadata.role] ?? UserRoleEnum.customer;
  }
  return UserRoleEnum.customer;
}

type ClerkUserData = {
  id: string;
  email_addresses?: { email_address: string }[];
  first_name?: string;
  last_name?: string;
  image_url?: string;
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

  const data = evt.data as ClerkUserData;
  const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data;
  const email = email_addresses?.[0]?.email_address ?? "unknown@email.com";
  const role = resolveRole(public_metadata);

  switch (evt.type) {
    case "user.created": {
      try {
        await prisma.user.upsert({
          where: { id },
          update: {
            email,
            firstName: first_name ?? "",
            lastName: last_name ?? "",
            role,
            avatarUrl: image_url,
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
          },
        });
        console.log(`✅ Webhook: user.created — ${email} (${role})`);
      } catch (err) {
        console.error(`❌ Webhook: user.created failed for ${email}:`, err);
      }
      break;
    }

    case "user.updated": {
      try {
        await prisma.user.upsert({
          where: { id },
          update: {
            email,
            firstName: first_name ?? "",
            lastName: last_name ?? "",
            role,
            avatarUrl: image_url,
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
          },
        });
        console.log(`✅ Webhook: user.updated — ${email} (${role})`);
      } catch (err) {
        console.error(`❌ Webhook: user.updated failed for ${email}:`, err);
      }
      break;
    }

    case "user.deleted": {
      try {
        await prisma.user.delete({ where: { id } });
        console.log(`✅ Webhook: user.deleted — ${id}`);
      } catch {
        // User may not exist in DB; that's fine
        console.log(`ℹ️  Webhook: user.deleted — ${id} (not in DB, skipping)`);
      }
      break;
    }

    default: {
      console.log(`ℹ️  Webhook: unhandled event type — ${evt.type}`);
    }
  }

  return new Response("OK", { status: 200 });
}
