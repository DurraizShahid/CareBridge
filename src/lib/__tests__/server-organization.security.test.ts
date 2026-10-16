import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { getServerOrganization, AuthorizationError } from "../server-organization";

describe("CB-018: server-organization tenant isolation & fail-closed resolution", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when user is not authenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const result = await getServerOrganization();
    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("throws AuthorizationError when database query throws", async () => {
    authMock.mockResolvedValue({ userId: "user-123" });
    prismaMock.user.findUnique.mockRejectedValue(new Error("Connection refused"));

    await expect(getServerOrganization()).rejects.toThrow(AuthorizationError);
    await expect(getServerOrganization()).rejects.toThrow(/Connection refused/);
  });

  it("throws AuthorizationError when user record does not exist in DB", async () => {
    authMock.mockResolvedValue({ userId: "user-missing" });
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(getServerOrganization()).rejects.toThrow(AuthorizationError);
    await expect(getServerOrganization()).rejects.toMatchObject({ status: 403, statusCode: 403 });
  });

  it("throws AuthorizationError when user has no organizationId in DB", async () => {
    authMock.mockResolvedValue({ userId: "user-no-org" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-no-org",
      organizationId: null,
      organization: null,
      role: "social_worker",
    });

    await expect(getServerOrganization()).rejects.toThrow(AuthorizationError);
  });

  it("throws AuthorizationError when user organization does not exist in DB", async () => {
    authMock.mockResolvedValue({ userId: "user-dangling" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-dangling",
      organizationId: "org-deleted",
      organization: null,
      role: "social_worker",
    });

    await expect(getServerOrganization()).rejects.toThrow(AuthorizationError);
  });

  it("returns authoritative organization context when DB verifies user and org membership", async () => {
    authMock.mockResolvedValue({ userId: "user-123" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-123",
      organizationId: "org-hospital-1",
      role: "social_worker",
      organization: {
        id: "org-hospital-1",
        name: "Metro Hospital",
        type: "hospital",
      },
    });

    const result = await getServerOrganization();
    expect(result).toEqual({
      userId: "user-123",
      organizationId: "org-hospital-1",
      organizationType: "hospital",
      role: "social-worker",
      isSuperadmin: false,
    });
  });

  it("correctly identifies superadmin role from DB", async () => {
    authMock.mockResolvedValue({ userId: "admin-1" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "admin-1",
      organizationId: "org-main",
      role: "superadmin",
      organization: {
        id: "org-main",
        name: "HQ",
        type: "hospital",
      },
    });

    const result = await getServerOrganization();
    expect(result?.isSuperadmin).toBe(true);
    expect(result?.role).toBe("superadmin");
  });

  it("CB-017: throws AuthorizationError when user organization is deactivated (isActive: false)", async () => {
    authMock.mockResolvedValue({ userId: "user-deactivated" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-deactivated",
      organizationId: "org-inactive",
      role: "social_worker",
      organization: {
        id: "org-inactive",
        name: "Closed Hospital",
        type: "hospital",
        isActive: false,
      },
    });

    await expect(getServerOrganization()).rejects.toThrow(AuthorizationError);
    await expect(getServerOrganization()).rejects.toMatchObject({ status: 403, statusCode: 403 });
  });

  it("CB-017: throws AuthorizationError when user organization is soft-deleted (deletedAt is set)", async () => {
    authMock.mockResolvedValue({ userId: "user-deleted" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-deleted",
      organizationId: "org-deleted",
      role: "social_worker",
      organization: {
        id: "org-deleted",
        name: "Deleted Hospital",
        type: "hospital",
        isActive: true,
        deletedAt: new Date(),
      },
    });

    await expect(getServerOrganization()).rejects.toThrow(AuthorizationError);
    await expect(getServerOrganization()).rejects.toMatchObject({ status: 403, statusCode: 403 });
  });
});
