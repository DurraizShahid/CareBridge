"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveRole, roleHasPermission } from "@/lib/permissions";
import { createHospital, updateHospital, deleteHospital } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import type { Address } from "@/types";

export type HospitalActionState = {
  status: "idle" | "success" | "error";
  message: string;
  warning?: string;
};

export interface HospitalFormValues {
  id?: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  phone: string;
  npi: string;
  imageUrl?: string;
  logoUrl?: string;
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseHospitalForm(formData: FormData): HospitalFormValues {
  return {
    id: formValue(formData, "id") || undefined,
    name: formValue(formData, "name"),
    street: formValue(formData, "street"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    zipCode: formValue(formData, "zipCode"),
    county: formValue(formData, "county") || undefined,
    phone: formValue(formData, "phone"),
    npi: formValue(formData, "npi"),
    imageUrl: formValue(formData, "imageUrl") || undefined,
    logoUrl: formValue(formData, "logoUrl") || undefined,
  };
}

function validateHospitalForm(values: HospitalFormValues): string | null {
  if (!values.name) return "Hospital name is required.";
  if (!values.street) return "Street address is required.";
  if (!values.city) return "City is required.";
  if (!values.state) return "State is required.";
  if (!values.zipCode) return "ZIP code is required.";
  if (!values.phone) return "Phone number is required.";
  if (!values.npi) return "NPI is required.";
  if (!/^\d{10}$/.test(values.npi.replace(/\D/g, ""))) return "NPI must be a 10-digit number.";
  return null;
}

function buildAddress(values: HospitalFormValues): Address {
  return {
    street: values.street,
    city: values.city,
    state: values.state,
    zipCode: values.zipCode,
    ...(values.county ? { county: values.county } : {}),
  };
}

async function requireHospitalManager() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  const role = resolveRole(dbUser?.role);

  if (!roleHasPermission(role, "hospitals:manage")) {
    throw new Error("Forbidden");
  }

  const org = await getServerOrganization();
  if (!org) throw new Error("No organization context");

  return { userId, role, organizationId: org.organizationId };
}

export async function createHospitalAction(
  formData: FormData,
): Promise<HospitalActionState> {
  try {
    const { organizationId } = await requireHospitalManager();
    const values = parseHospitalForm(formData);
    const error = validateHospitalForm(values);
    if (error) return { status: "error", message: error };

    await createHospital({
      name: values.name,
      address: buildAddress(values),
      phone: values.phone,
      npi: values.npi,
      imageUrl: values.imageUrl,
      logoUrl: values.logoUrl,
      organizationId,
    });

    revalidatePath("/dashboard/hospitals");
    return { status: "success", message: "Hospital created." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create hospital.",
    };
  }
}

export async function updateHospitalAction(
  formData: FormData,
): Promise<HospitalActionState> {
  try {
    const { organizationId, role } = await requireHospitalManager();
    const values = parseHospitalForm(formData);
    if (!values.id) return { status: "error", message: "Hospital ID is missing." };

    const error = validateHospitalForm(values);
    if (error) return { status: "error", message: error };

    await updateHospital(
      values.id,
      {
        name: values.name,
        address: buildAddress(values),
        phone: values.phone,
        npi: values.npi,
        imageUrl: values.imageUrl,
        logoUrl: values.logoUrl,
      },
      organizationId,
      role,
    );

    revalidatePath("/dashboard/hospitals");
    return { status: "success", message: "Hospital updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update hospital.",
    };
  }
}

export async function deleteHospitalAction(
  id: string,
): Promise<HospitalActionState> {
  try {
    const { organizationId, role } = await requireHospitalManager();
    if (!id) return { status: "error", message: "Hospital ID is missing." };

    const result = await deleteHospital(id, organizationId, role);
    if (!result.success) return { status: "error", message: result.error ?? "Delete failed." };

    revalidatePath("/dashboard/hospitals");
    return {
      status: "success",
      message: "Hospital deleted.",
      warning: result.warning,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not delete hospital.",
    };
  }
}
